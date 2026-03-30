#!/usr/bin/env python3
"""Harvest AI tool/skill operators from awesome lists and GitHub topics."""

import re
import json
import random
import hashlib
from datetime import datetime, timezone

from scrapling import Fetcher
from pymongo import MongoClient
import os

# --- Config ---
MONGO_URI = os.environ.get('DATABASE_URL', 'mongodb://localhost:27017/aegis')
CREATOR_WALLET = "DemoWa11etForSeedDataXXXXXXXXXXXXXXXXXXXXXX"

CATEGORY_KEYWORDS = {
    'code-review': ['code-review', 'lint', 'static-analysis', 'code-quality', 'refactor'],
    'security-audit': ['security', 'vulnerability', 'audit', 'pentest', 'cve', 'exploit', 'threat'],
    'data-extraction': ['scraping', 'scraper', 'extraction', 'crawler', 'etl', 'data-pipeline', 'parsing'],
    'financial-analysis': ['finance', 'trading', 'stock', 'defi', 'crypto', 'portfolio', 'payment'],
    'text-generation': ['text-generation', 'writing', 'content', 'copywriting', 'blog', 'chatbot', 'chat'],
    'search': ['search', 'retrieval', 'rag', 'indexing', 'vector', 'embedding', 'knowledge'],
    'image-generation': ['image', 'diffusion', 'stable-diffusion', 'dalle', 'vision', 'art', 'graphic'],
    'classification': ['classification', 'categoriz', 'tagging', 'label', 'detect'],
    'summarization': ['summary', 'summariz', 'digest', 'tldr', 'abstract'],
    'translation': ['translat', 'i18n', 'multilingual', 'language-model', 'locali'],
    'sentiment-analysis': ['sentiment', 'opinion', 'emotion', 'tone'],
}

AWESOME_URLS = {
    'awesome-mcp-servers': 'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
    'awesome-ai-agents': 'https://raw.githubusercontent.com/e2b-dev/awesome-ai-agents/main/README.md',
    'awesome-llm-apps': 'https://raw.githubusercontent.com/Shubhamsaboo/awesome-llm-apps/main/README.md',
}

GITHUB_API_URLS = {
    'mcp-server-topic': 'https://api.github.com/search/repositories?q=topic:mcp-server+stars:>20&sort=stars&per_page=100',
    'ai-agent-topic': 'https://api.github.com/search/repositories?q=topic:ai-agent+stars:>50&sort=stars&per_page=100',
}


def infer_category(description: str, topics: list[str] = None) -> str:
    text = (description or '').lower()
    if topics:
        text += ' ' + ' '.join(t.lower() for t in topics)
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return cat
    return 'other'


def slug_from_repo(repo_full_name: str) -> str:
    return repo_full_name.lower().replace('/', '-').replace('.', '-').replace('_', '-')


def human_name(repo_name: str) -> str:
    # Take just the repo part (after /)
    parts = repo_name.split('/')
    name = parts[-1] if len(parts) > 1 else parts[0]
    return name.replace('-', ' ').replace('_', ' ').title()


def fetch_url(fetcher, url, label):
    print(f"  Fetching {label}...")
    try:
        page = fetcher.get(url, stealthy_headers=True, follow_redirects=True)
        content = page.body.decode('utf-8') if page.body else ""
        print(f"    Got {len(content)} bytes")
        return content
    except Exception as e:
        print(f"    ERROR fetching {label}: {e}")
        return ""


def main():
    fetcher = Fetcher()
    all_repos = {}  # slug -> {name, description, topics, source}

    # --- 1. Awesome lists (Markdown) ---
    for source_name, url in AWESOME_URLS.items():
        content = fetch_url(fetcher, url, source_name)
        if not content:
            continue
        matches = re.findall(r'https?://github\.com/([\w.\-]+/[\w.\-]+)', content)
        # deduplicate and clean trailing dots/dashes
        seen = set()
        for m in matches:
            m = m.rstrip('.-')
            if '/' not in m:
                continue
            owner, repo = m.split('/', 1)
            # skip non-repo links like user profiles
            if not repo or repo.startswith('.'):
                continue
            slug = slug_from_repo(m)
            if slug in seen:
                continue
            seen.add(slug)
            # Try to get inline description from markdown
            desc_pattern = re.escape(m) + r'[)\]]\s*[-–—:]*\s*(.{0,300})'
            desc_match = re.search(desc_pattern, content)
            desc = desc_match.group(1).strip().split('\n')[0] if desc_match else ''
            desc = re.sub(r'[<\[].*', '', desc).strip()  # remove trailing markdown
            if slug not in all_repos:
                all_repos[slug] = {
                    'full_name': m,
                    'description': desc[:200],
                    'topics': [],
                    'source': source_name,
                    'stars': 0,
                }
        print(f"    Extracted {len(seen)} repos from {source_name}")

    # --- 2. GitHub API topics (JSON) ---
    for source_name, url in GITHUB_API_URLS.items():
        content = fetch_url(fetcher, url, source_name)
        if not content:
            continue
        try:
            data = json.loads(content)
            items = data.get('items', [])
        except json.JSONDecodeError:
            print(f"    Failed to parse JSON for {source_name}")
            continue
        count = 0
        for item in items:
            full_name = item.get('full_name', '')
            if not full_name or '/' not in full_name:
                continue
            slug = slug_from_repo(full_name)
            desc = (item.get('description') or '')[:200]
            topics = item.get('topics', [])
            stars = item.get('stargazers_count', 0)
            if slug not in all_repos:
                all_repos[slug] = {
                    'full_name': full_name,
                    'description': desc,
                    'topics': topics,
                    'source': source_name,
                    'stars': stars,
                }
                count += 1
            else:
                # Enrich existing entry with better data
                existing = all_repos[slug]
                if not existing['description'] and desc:
                    existing['description'] = desc
                if not existing['topics'] and topics:
                    existing['topics'] = topics
                if stars > existing.get('stars', 0):
                    existing['stars'] = stars
        print(f"    Extracted {count} new repos from {source_name}")

    print(f"\nTotal unique repos collected: {len(all_repos)}")

    # --- 3. Insert into MongoDB ---
    client = MongoClient(MONGO_URI)
    db = client.aegis

    # Get existing slugs
    existing_slugs = set(
        doc['slug'] for doc in db.operators.find({}, {'slug': 1, '_id': 0})
    )
    print(f"Existing operators in DB: {len(existing_slugs)}")

    new_operators = []
    for slug, info in all_repos.items():
        if slug in existing_slugs:
            continue
        category = infer_category(info['description'], info.get('topics', []))
        new_operators.append({
            'slug': slug,
            'name': human_name(info['full_name']),
            'category': category,
            'tagline': info['description'][:200] if info['description'] else f"AI tool from {info['full_name']}",
            'trustScore': random.randint(75, 95),
            'pricePerCall': round(random.uniform(0.001, 0.05), 4),
            'isActive': True,
            'creatorWallet': CREATOR_WALLET,
            'source': info['source'],
            'githubRepo': info['full_name'],
            'stars': info.get('stars', 0),
            'createdAt': datetime.now(timezone.utc),
            'updatedAt': datetime.now(timezone.utc),
        })

    if new_operators:
        result = db.operators.insert_many(new_operators)
        print(f"\nInserted {len(result.inserted_ids)} new operators into MongoDB!")
    else:
        print("\nNo new operators to insert.")

    # Print summary by category
    from collections import Counter
    cats = Counter(op['category'] for op in new_operators)
    print("\nNew operators by category:")
    for cat, count in cats.most_common():
        print(f"  {cat}: {count}")

    # Print a few examples
    print("\nSample new operators:")
    for op in new_operators[:10]:
        print(f"  [{op['category']}] {op['slug']}: {op['tagline'][:80]}")

    total_now = db.operators.count_documents({})
    print(f"\nTotal operators in DB now: {total_now}")

    client.close()


if __name__ == '__main__':
    main()
