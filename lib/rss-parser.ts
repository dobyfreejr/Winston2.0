export interface RSSItem {
  title: string
  description?: string
  link?: string
  pubDate?: Date
  guid?: string
  content?: string
  categories?: string[]
}

export interface RSSFeed {
  title?: string
  description?: string
  link?: string
  items: RSSItem[]
}

export async function parseRSS(xmlContent: string): Promise<RSSFeed> {
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')

    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Failed to parse RSS feed: Invalid XML')
    }

    const isAtom = doc.querySelector('feed[xmlns*="atom"]') !== null

    if (isAtom) {
      return parseAtomFeed(doc)
    } else {
      return parseRSSFeed(doc)
    }
  } else {
    return parseRSSServerSide(xmlContent)
  }
}

function parseRSSServerSide(xmlContent: string): RSSFeed {
  const feed: RSSFeed = { items: [] }

  const channelTitleMatch = xmlContent.match(/<title[^>]*>(.*?)<\/title>/s)
  if (channelTitleMatch) {
    feed.title = cleanText(channelTitleMatch[1])
  }

  const channelDescMatch = xmlContent.match(/<description[^>]*>(.*?)<\/description>/s)
  if (channelDescMatch) {
    feed.description = cleanText(channelDescMatch[1])
  }

  const channelLinkMatch = xmlContent.match(/<link[^>]*>(.*?)<\/link>/s)
  if (channelLinkMatch) {
    feed.link = cleanText(channelLinkMatch[1])
  }

  const isAtom = xmlContent.includes('<feed') && xmlContent.includes('xmlns="http://www.w3.org/2005/Atom"')

  if (isAtom) {
    const entryRegex = /<entry[^>]*>(.*?)<\/entry>/gs
    const entries = Array.from(xmlContent.matchAll(entryRegex))

    for (const entryMatch of entries) {
      const entryContent = entryMatch[1]

      const title = extractTag(entryContent, 'title')
      const summary = extractTag(entryContent, 'summary')
      const content = extractTag(entryContent, 'content') || summary
      const id = extractTag(entryContent, 'id')
      const published = extractTag(entryContent, 'published') || extractTag(entryContent, 'updated')

      const linkMatch = entryContent.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/)
      const link = linkMatch ? linkMatch[1] : undefined

      const categoryMatches = Array.from(entryContent.matchAll(/<category[^>]*term=["']([^"']+)["'][^>]*\/?>/g))
      const categories = categoryMatches.map(m => m[1])

      let pubDate: Date | undefined
      if (published) {
        try {
          pubDate = new Date(published)
          if (isNaN(pubDate.getTime())) pubDate = undefined
        } catch {
          pubDate = undefined
        }
      }

      if (title) {
        feed.items.push({
          title,
          description: summary,
          link,
          pubDate,
          guid: id,
          content,
          categories
        })
      }
    }
  } else {
    const itemRegex = /<item[^>]*>(.*?)<\/item>/gs
    const items = Array.from(xmlContent.matchAll(itemRegex))

    for (const itemMatch of items) {
      const itemContent = itemMatch[1]

      const title = extractTag(itemContent, 'title')
      const description = extractTag(itemContent, 'description')
      const link = extractTag(itemContent, 'link')
      const guid = extractTag(itemContent, 'guid')
      const pubDateStr = extractTag(itemContent, 'pubDate')
      const contentEncoded = extractTag(itemContent, 'content:encoded')

      const categoryMatches = Array.from(itemContent.matchAll(/<category[^>]*>(.*?)<\/category>/g))
      const categories = categoryMatches.map(m => cleanText(m[1]))

      let pubDate: Date | undefined
      if (pubDateStr) {
        try {
          pubDate = new Date(pubDateStr)
          if (isNaN(pubDate.getTime())) pubDate = undefined
        } catch {
          pubDate = undefined
        }
      }

      if (title) {
        feed.items.push({
          title,
          description,
          link,
          pubDate,
          guid,
          content: contentEncoded || description,
          categories
        })
      }
    }
  }

  return feed
}

function extractTag(content: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>(.+?)<\/${tagName}>`, 's')
  const match = content.match(regex)
  return match ? cleanText(match[1]) : undefined
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function parseRSSFeed(doc: Document): RSSFeed {
  const channel = doc.querySelector('channel')

  const feed: RSSFeed = {
    title: getElementText(channel, 'title'),
    description: getElementText(channel, 'description'),
    link: getElementText(channel, 'link'),
    items: []
  }

  const items = doc.querySelectorAll('item')
  items.forEach(item => {
    const categories: string[] = []
    const categoryElements = item.querySelectorAll('category')
    categoryElements.forEach(cat => {
      const text = cat.textContent?.trim()
      if (text) categories.push(text)
    })

    const pubDateStr = getElementText(item, 'pubDate')
    let pubDate: Date | undefined
    if (pubDateStr) {
      try {
        pubDate = new Date(pubDateStr)
        if (isNaN(pubDate.getTime())) {
          pubDate = undefined
        }
      } catch {
        pubDate = undefined
      }
    }

    feed.items.push({
      title: getElementText(item, 'title') || '',
      description: getElementText(item, 'description'),
      link: getElementText(item, 'link'),
      pubDate,
      guid: getElementText(item, 'guid'),
      content: getElementText(item, 'content:encoded') || getElementText(item, 'description'),
      categories
    })
  })

  return feed
}

function parseAtomFeed(doc: Document): RSSFeed {
  const feedElement = doc.querySelector('feed')

  const feed: RSSFeed = {
    title: getElementText(feedElement, 'title'),
    description: getElementText(feedElement, 'subtitle'),
    link: feedElement?.querySelector('link[rel="alternate"]')?.getAttribute('href') || undefined,
    items: []
  }

  const entries = doc.querySelectorAll('entry')
  entries.forEach(entry => {
    const categories: string[] = []
    const categoryElements = entry.querySelectorAll('category')
    categoryElements.forEach(cat => {
      const term = cat.getAttribute('term')
      if (term) categories.push(term)
    })

    const publishedStr = getElementText(entry, 'published') || getElementText(entry, 'updated')
    let pubDate: Date | undefined
    if (publishedStr) {
      try {
        pubDate = new Date(publishedStr)
        if (isNaN(pubDate.getTime())) {
          pubDate = undefined
        }
      } catch {
        pubDate = undefined
      }
    }

    const contentElement = entry.querySelector('content')
    const summaryElement = entry.querySelector('summary')
    const content = contentElement?.textContent?.trim() || summaryElement?.textContent?.trim()

    feed.items.push({
      title: getElementText(entry, 'title') || '',
      description: getElementText(entry, 'summary'),
      link: entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || undefined,
      pubDate,
      guid: getElementText(entry, 'id'),
      content,
      categories
    })
  })

  return feed
}

function getElementText(parent: Element | null | undefined, selector: string): string | undefined {
  if (!parent) return undefined
  const element = parent.querySelector(selector)
  const text = element?.textContent?.trim()
  return text || undefined
}

export function extractIndicatorsFromRSS(feed: RSSFeed): Array<{
  indicator: string
  type: string
  context: string
  timestamp?: Date
  tags: string[]
}> {
  const indicators: Array<{
    indicator: string
    type: string
    context: string
    timestamp?: Date
    tags: string[]
  }> = []

  const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
  const domainPattern = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g
  const hashPattern = /\b[a-fA-F0-9]{32,64}\b/g
  const urlPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

  for (const item of feed.items) {
    const text = `${item.title} ${item.description || ''} ${item.content || ''}`
    const tags = item.categories || []

    const ips = text.match(ipPattern) || []
    for (const ip of ips) {
      if (isValidIP(ip)) {
        indicators.push({
          indicator: ip,
          type: 'ip',
          context: item.title,
          timestamp: item.pubDate,
          tags
        })
      }
    }

    const domains = text.match(domainPattern) || []
    for (const domain of domains) {
      if (isValidDomain(domain)) {
        indicators.push({
          indicator: domain,
          type: 'domain',
          context: item.title,
          timestamp: item.pubDate,
          tags
        })
      }
    }

    const hashes = text.match(hashPattern) || []
    for (const hash of hashes) {
      indicators.push({
        indicator: hash,
        type: 'hash',
        context: item.title,
        timestamp: item.pubDate,
        tags
      })
    }

    const urls = text.match(urlPattern) || []
    for (const url of urls) {
      indicators.push({
        indicator: url,
        type: 'url',
        context: item.title,
        timestamp: item.pubDate,
        tags
      })
    }

    const emails = text.match(emailPattern) || []
    for (const email of emails) {
      indicators.push({
        indicator: email,
        type: 'email',
        context: item.title,
        timestamp: item.pubDate,
        tags
      })
    }
  }

  const uniqueIndicators = new Map<string, typeof indicators[0]>()
  for (const indicator of indicators) {
    if (!uniqueIndicators.has(indicator.indicator)) {
      uniqueIndicators.set(indicator.indicator, indicator)
    }
  }

  return Array.from(uniqueIndicators.values())
}

function isValidIP(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false

  for (const part of parts) {
    const num = parseInt(part, 10)
    if (isNaN(num) || num < 0 || num > 255) return false
  }

  if (parts[0] === '0' || parts[0] === '127' || parts[0] === '255') return false

  return true
}

function isValidDomain(domain: string): boolean {
  if (domain.length < 4 || domain.length > 253) return false

  if (domain.startsWith('.') || domain.endsWith('.')) return false

  if (domain.split('.').length < 2) return false

  const commonExtensions = ['.com', '.org', '.net', '.edu', '.gov', '.mil', '.io', '.co', '.uk', '.de', '.fr', '.jp', '.cn', '.ru', '.br', '.in', '.au', '.ca']
  const hasCommonExtension = commonExtensions.some(ext => domain.endsWith(ext))

  if (!hasCommonExtension) {
    const tld = domain.split('.').pop()
    if (tld && tld.length < 2) return false
  }

  return true
}
