# Mychips Agentic CRM

An intelligent CRM system that automates lead qualification, outreach sequencing, and multi-rep coordination for B2B sales teams.

## The Problem

Traditional CRM workflows are complicated:
- Leads from CSV files need manual due diligence and pitch angle research
- Existing partners in mature stages (IO stage, integration, live, deal won) need to be excluded
- Multiple contacts from one company create confusion - we need to reach the most relevant rep first
- If one contact doesn't reply, we need intelligent sequencing to the next best contact
- Multi-rep sales teams need dynamic, coordinated outreach without overlap
- Outreach emails need to reference competitor insights and case studies intelligently

## The Solution

Mychips Agentic CRM automates the entire pipeline:

1. CSV Lead Import with AI-powered due diligence and pitch angle generation
2. Pipedrive Integration to exclude mature-stage partners automatically
3. Intelligent Contact Prioritization - reaches one rep per company based on relevance
4. Smart Sequencing - if no reply, automatically moves to next best contact
5. Multi-Rep Coordination via Gmail Suite - prevents duplicate outreach
6. Live Publisher Data Endpoints - feeds real-time competitor and case study data into personalized emails

## Target Users

B2B sales teams managing high-volume outreach across multiple accounts with distributed reps.

## Tech Stack

- Frontend: Next.js 15 with TypeScript and Tailwind CSS
- Backend: Node.js + Express API
- Database: PostgreSQL (via Supabase)
- Integrations: Pipedrive API, Gmail API, OpenAI for lead analysis
- Deployment: Vercel (frontend), Railway/Render (backend)

## Project Structure

- /app - Next.js frontend pages and components
- /backend - Express API server
  - /routes - API endpoint definitions
  - /controllers - Business logic handlers
  - /services - External API integrations (Pipedrive, Gmail, OpenAI)
  - /config - Database and environment configuration
  - /middleware - Authentication and validation
- /public - Static assets

## Getting Started

This project is built step-by-step through the StepAhead mentorship program. Each milestone adds new functionality incrementally.

Current Status: Milestone 0 - Project Setup Complete

## Development Roadmap

- M0: Project setup and repository initialization
- M1: Database schema and Supabase connection
- M2: CSV upload and lead import API
- M3: Pipedrive integration and mature partner filtering
- M4: AI-powered lead analysis and pitch generation
- M5: Contact prioritization logic
- M6: Gmail integration and outreach sequencing
- M7: Multi-rep coordination dashboard
- M8: Live publisher data endpoints
- M9: Email template engine with competitor insights
- M10: Analytics and reporting

## License

MIT
# webhook test
# webhook test
