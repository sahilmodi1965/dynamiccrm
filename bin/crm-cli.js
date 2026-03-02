#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           Mychips Agentic CRM - Help Guide                ║
╔════════════════════════════════════════════════════════════╗

USAGE:
  npm run dev              Start the development server
  npm run build            Build for production
  npm run start            Start production server
  node bin/crm-cli.js      Show this help message

FEATURES:
  ✓ Upload CSV files with leads (company, contact, industry)
  ✓ AI-powered lead analysis with relevance scoring
  ✓ Personalized pitch angle suggestions
  ✓ Due diligence insights for each lead
  ✓ Beautiful dashboard with formatted results

API ENDPOINTS:
  POST /api/analyze-leads   Upload and analyze CSV file
  GET  /api/results/:id     Retrieve analysis results
  POST /api/leads/save      Save leads to database
  GET  /api/leads/get       Get all saved leads

GETTING STARTED:
  1. Start server: npm run dev
  2. Open browser: http://localhost:3000
  3. Upload your CSV file
  4. View AI-analyzed results

For more info: https://github.com/yourusername/dynamiccrm
  `);
  process.exit(0);
}

console.log('Mychips Agentic CRM CLI');
console.log('Run with --help for usage information');
