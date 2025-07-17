# SOC Analysis Platform

A comprehensive Security Operations Center (SOC) platform for threat intelligence analysis and security monitoring.

## Features

- **Threat Intelligence Lookup**: Analyze IPs, domains, URLs, and file hashes
- **Multi-Source Integration**: VirusTotal, IPGeolocation, WhoisXML, AbuseIPDB, and more
- **Real-time Analysis**: Get comprehensive threat intelligence reports
- **Dashboard Overview**: Monitor threats and security metrics
- **Responsive Design**: Works on desktop and mobile devices

## API Integrations

This platform integrates with several threat intelligence services:

### Required APIs
- **VirusTotal**: Malware and URL analysis
- **IPGeolocation**: IP address geolocation data
- **WhoisXML**: Domain registration information

### Optional APIs
- **AbuseIPDB**: IP abuse reports
- **URLVoid**: URL reputation checking
- **Malware Bazaar**: Malware sample database (free, no API key required)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd soc-analysis-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Required API Keys
   NEXT_PUBLIC_VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
   NEXT_PUBLIC_IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key_here
   NEXT_PUBLIC_WHOISXML_API_KEY=your_whoisxml_api_key_here
   
   # Optional API Keys
   NEXT_PUBLIC_ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
   NEXT_PUBLIC_URLVOID_API_KEY=your_urlvoid_api_key_here
   ```

4. **Get API Keys**

   ### VirusTotal
   - Visit: https://www.virustotal.com/gui/my-apikey
   - Sign up for a free account
   - Copy your API key

   ### IPGeolocation
   - Visit: https://ipgeolocation.io/
   - Sign up for a free account (1,000 requests/month)
   - Copy your API key

   ### WhoisXML
   - Visit: https://whois.whoisxmlapi.com/
   - Sign up for a free account (1,000 requests/month)
   - Copy your API key

   ### AbuseIPDB (Optional)
   - Visit: https://www.abuseipdb.com/api
   - Sign up for a free account
   - Copy your API key

   ### URLVoid (Optional)
   - Visit: https://www.urlvoid.com/api/
   - Sign up for a free account
   - Copy your API key

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Verify API Configuration**
   - Navigate to Settings page
   - Check that all APIs show as "Active"
   - If not, verify your API keys in `.env.local`

## Usage

### Threat Analysis
1. Go to the "Threat Analysis" page
2. Enter an IP address, domain, URL, or file hash
3. Click "Analyze" to get comprehensive threat intelligence
4. Review results across multiple tabs:
   - Overview: Summary of threat intelligence
   - VirusTotal: Detailed malware analysis
   - Geolocation: IP location data
   - Domain Info: Registration details
   - Malware: Known malware samples

### Dashboard
- View security metrics and statistics
- Monitor recent threat activity
- Quick access to threat analysis tools

## API Rate Limits

Be aware of API rate limits:
- **VirusTotal**: 4 requests/minute (free tier)
- **IPGeolocation**: 1,000 requests/month (free tier)
- **WhoisXML**: 1,000 requests/month (free tier)
- **AbuseIPDB**: 1,000 requests/day (free tier)

## Development

### Project Structure
```
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   ├── layout/          # Layout components
│   ├── threat-analysis/ # Threat analysis components
│   └── ui/             # UI components
├── lib/                  # Utility functions
├── types/               # TypeScript type definitions
└── public/             # Static assets
```

### Adding New APIs
1. Add API key to `.env.local`
2. Create API integration function in `lib/threat-intel-api.ts`
3. Update types in `types/threat-intel.ts`
4. Add UI components as needed

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS
   - Docker

3. **Configure environment variables**
   - Add all API keys to your deployment platform's environment variables
   - Remove the `NEXT_PUBLIC_` prefix for server-side only keys if needed

## Security Considerations

- API keys are exposed to the client side (NEXT_PUBLIC_ prefix)
- For production, consider moving sensitive API calls to server-side API routes
- Implement rate limiting to prevent API abuse
- Use HTTPS in production
- Regularly rotate API keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review API provider documentation for API-specific issues