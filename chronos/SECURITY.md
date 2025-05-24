# Security and Environment Setup Guide

## 🔒 Environment Variables and Security

This project uses environment variables to store sensitive configuration data. **Never commit actual environment variables to version control.**

### Setup Instructions

1. **Backend Environment Setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Frontend Environment Setup:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

### Required Environment Variables

#### Backend (.env)
- `OPENAI_API_KEY` - Your OpenAI API key for LLM functionality
- `NEO4J_PASSWORD` - Password for Neo4j database
- `REDIS_URL` - Redis connection string
- `PUBMED_API_KEY` - PubMed API key (optional)

#### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `API_URL` - Internal API URL for server-side requests

### Security Best Practices

1. **Never commit .env files** - They are already in .gitignore
2. **Use different values for different environments** (dev, staging, prod)
3. **Rotate API keys regularly**
4. **Use strong, unique passwords** for databases
5. **Limit API key permissions** to only what's needed

### Files Protected by .gitignore

The following sensitive files/patterns are automatically ignored:

- `.env*` - All environment files
- `*.key`, `*.pem` - Certificate and key files
- `secrets/` - Any secrets directory
- `config/secrets.json` - Configuration with secrets
- Database files (`*.db`, `*.sqlite3`)
- Docker override files
- IDE configuration files
- OS-specific files (.DS_Store, Thumbs.db)

### Verification

To verify your environment is properly configured:

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend is accessible
curl -I http://localhost:3000
```

### Troubleshooting

If you encounter issues:

1. Ensure all required environment variables are set
2. Check Docker containers are running: `docker-compose ps`
3. Check logs: `docker-compose logs api`
4. Verify .env files exist and have correct values

## 🚨 Security Warnings

- **Never share your .env files**
- **Never commit API keys to git**
- **Use secure passwords for production**
- **Enable firewall rules for production deployments**
- **Regularly update dependencies**
