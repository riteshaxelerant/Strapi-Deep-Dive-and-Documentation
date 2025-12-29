# Strapi Installation Guide

## Overview

This guide provides step-by-step instructions for setting up Strapi on your local development environment. It covers all installation methods, prerequisites, and common issues you might encounter.

## Prerequisites

### Official Documentation Reference

Before starting, review the official Strapi documentation:
- **Quick Start Guide**: [https://docs.strapi.io/dev-docs/quick-start](https://docs.strapi.io/dev-docs/quick-start)

### System Requirements

#### Node.js and npm

**Node.js Requirements:**
- **Recommended**: Node.js v20.x (Active LTS) or v22.x (Active LTS)
- **Minimum**: Node.js v18.x (Maintenance LTS)
- **Not Supported**: Odd-numbered versions (v19, v21, v23, etc.)

**npm Requirements:**
- npm v6.x or higher (comes bundled with Node.js)

**Check Your Current Versions:**
```bash
node -v
npm -v
```

**Note**: If you have an unsupported Node.js version (like v23), you'll need to use NVM to switch to a supported version.

#### Optional but Recommended Tools

**Yarn Package Manager:**
- Alternative to npm, often faster for dependency management
- Useful for Strapi projects

**NVM (Node Version Manager):**
- Essential for managing multiple Node.js versions
- Allows switching between projects with different Node.js requirements
- Particularly useful if you work on multiple projects

---

## Database Setup with Docker

Before installing Strapi, you may want to set up a database using Docker containers. This section covers setting up PostgreSQL and MySQL databases that can be used with Strapi.

### Prerequisites for Database Setup

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)
- Basic understanding of Docker containers

**Verify Docker Installation:**
```bash
docker --version
docker-compose --version
```

---

### Setting Up PostgreSQL with Docker

PostgreSQL is recommended for production Strapi applications. Here's how to set it up using Docker.

#### Step 1: Create Docker Compose File

Create a `docker-compose.yml` file in your project directory:

```yaml
version: '3'
services:  
  postgresql:
    restart: unless-stopped
    env_file: .env
    image: postgres:16.1-alpine
    container_name: postgresql-pgsqlcontainer
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    ports:
      - "${DATABASE_PORT}:5432"
    volumes:
      - .postgresql-data:/var/lib/postgresql/data
    networks:
      - default
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: postgresql-pgadmin_web
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
    depends_on:
      - postgresql
    ports:
      - "6420:80"
```

#### Step 2: Create .env File

Create a `.env` file in the same directory with the following variables:

```env
# PostgreSQL Database Configuration
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=strapi_db
DATABASE_PORT=5432

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin_password
```

**Security Note**: Use strong passwords in production. Never commit `.env` files to version control.

#### Step 3: Start PostgreSQL Container

```bash
# Start the containers
docker-compose up -d

# Verify containers are running
docker ps
```

#### Step 4: Verify PostgreSQL is Running

```bash
# Check container logs
docker logs postgresql-pgsqlcontainer

# Test connection (optional)
docker exec -it postgresql-pgsqlcontainer psql -U strapi_user -d strapi_db
```

#### Step 5: Access pgAdmin (Optional)

pgAdmin provides a web interface for managing PostgreSQL:

- **URL**: `http://localhost:6420`
- **Email**: Use the email from your `.env` file
- **Password**: Use the password from your `.env` file

**Connection Details for pgAdmin:**
- **Host**: `postgresql` (container name)
- **Port**: `5432`
- **Database**: `strapi_db`
- **Username**: `strapi_user`
- **Password**: Your database password

#### Step 6: Use with Strapi

When installing Strapi, use these database credentials:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your_secure_password
```

---

### Setting Up MySQL with Docker

MySQL is another popular database option for Strapi. Here's how to set it up using Docker.

#### Step 1: Create Docker Compose File

Create a `docker-compose.yml` file in your project directory:

```yaml
version: "3.1"
services:
  db:
    image: mariadb:10.5
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3358:3306"
    volumes:
      - ./data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    restart: always
    depends_on:
      - db
    ports:
      - "8088:80"
    environment:
      MYSQL_ROOT_PASSWORD: root
      UPLOAD_LIMIT: 300M
```

**Note**: This setup uses MariaDB (compatible with MySQL) and includes phpMyAdmin for database management.

#### Step 2: Create Database and User

After starting the containers, you'll need to create a database and user for Strapi:

```bash
# Start the containers
docker-compose up -d

# Access MySQL container
docker exec -it <container_name> mysql -uroot -proot

# In MySQL prompt, run:
CREATE DATABASE strapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'strapi_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON strapi_db.* TO 'strapi_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

**Alternative**: You can also create the database and user using phpMyAdmin web interface.

#### Step 3: Access phpMyAdmin (Optional)

phpMyAdmin provides a web interface for managing MySQL:

- **URL**: `http://localhost:8088`
- **Server**: `db` (container name)
- **Username**: `root`
- **Password**: `root` (or your custom password)

#### Step 4: Use with Strapi

When installing Strapi, use these database credentials:

```env
DATABASE_CLIENT=mysql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3358
DATABASE_NAME=strapi_db
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your_secure_password
```

**Note**: The port is `3358` as defined in the docker-compose.yml file.

---

### Docker Commands Reference

**Start containers:**
```bash
docker-compose up -d
```

**Stop containers:**
```bash
docker-compose down
```

**View running containers:**
```bash
docker ps
```

**View container logs:**
```bash
docker logs <container_name>
```

**Stop and remove containers (including volumes):**
```bash
docker-compose down -v
```

**Restart containers:**
```bash
docker-compose restart
```

---

### Database Connection Notes

**Important Points:**

1. **Host**: Use `127.0.0.1` or `localhost` when connecting from your host machine
2. **Port Mapping**: The port in docker-compose.yml (left side) is what you use from your host machine
3. **Container Names**: Use container names when connecting from other containers
4. **Data Persistence**: Volumes ensure data persists even if containers are removed
5. **Network**: Containers on the same network can communicate using service names

**Troubleshooting:**

- **Connection Refused**: Ensure containers are running (`docker ps`)
- **Port Already in Use**: Change the port mapping in docker-compose.yml
- **Authentication Failed**: Verify credentials match your .env file
- **Database Not Found**: Ensure database was created before connecting

---

## Installation Methods

### Method 1: Using npx (Recommended for Quick Start)

This is the fastest way to create a new Strapi project.

#### Step 1: Create a New Project

```bash
npx create-strapi@latest my-strapi-project
```

**What happens:**
- Downloads the latest Strapi version
- Creates a new project directory
- Installs all dependencies
- Prompts you to choose installation type (Quickstart or Custom)

#### Step 2: Choose Installation Type

You'll be prompted to choose:

1. **Quickstart (recommended for beginners)**
   - Uses SQLite database
   - Minimal configuration required
   - Best for learning and development

2. **Custom (manual setup)**
   - Choose your database (PostgreSQL, MySQL, SQLite)
   - More configuration options
   - Better for production-like setups

#### Step 3: Start Development Server

```bash
cd my-strapi-project
npm run develop
```

The server will start on `http://localhost:1337` and automatically open the admin panel in your browser.

#### Step 4: Create Admin User

On first launch, you'll be prompted to:
- Create the first administrator account
- Set up your admin credentials
- Access the Strapi admin panel

---

### Method 2: Using Yarn

If you prefer using Yarn:

```bash
yarn create strapi my-strapi-project
cd my-strapi-project
yarn develop
```

---

### Method 3: Using Docker

For containerized development:

#### Step 1: Create Docker Compose File

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  strapi:
    image: strapi/strapi:latest
    container_name: strapi-dev
    restart: unless-stopped
    env_file: .env
    environment:
      DATABASE_CLIENT: ${DATABASE_CLIENT}
      DATABASE_HOST: ${DATABASE_HOST}
      DATABASE_PORT: ${DATABASE_PORT}
      DATABASE_NAME: ${DATABASE_NAME}
      DATABASE_USERNAME: ${DATABASE_USERNAME}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - ./app:/srv/app
    ports:
      - "1337:1337"
    networks:
      - strapi
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    container_name: strapi-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - strapi

volumes:
  postgres_data:

networks:
  strapi:
    name: Strapi
    driver: bridge
```

#### Step 2: Run with Docker Compose

```bash
docker-compose up -d
```

---

## Installing NVM (Node Version Manager)

### macOS/Linux

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Reload your shell configuration
source ~/.zshrc  # For zsh (default on macOS)
# OR
source ~/.bashrc  # For bash
```

### Windows

Use [nvm-windows](https://github.com/coreybutler/nvm-windows) instead.

### Using NVM

```bash
# Install a specific Node.js version
nvm install 20

# Use a specific version
nvm use 20

# Set default version
nvm alias default 20

# List installed versions
nvm list

# List available versions
nvm list-remote
```

---

## Installing Yarn

### Using npm (Global Installation)

```bash
npm install --global yarn
```

### Using Homebrew (macOS)

```bash
brew install yarn
```

### Verify Installation

```bash
yarn --version
```

---

## Database Options

Strapi supports multiple databases:

### SQLite (Default - Quickstart)
- **Pros**: No setup required, perfect for development
- **Cons**: Not recommended for production
- **Use Case**: Learning, prototyping, small projects

### PostgreSQL (Recommended for Production)
- **Pros**: Robust, scalable, production-ready
- **Cons**: Requires separate installation
- **Use Case**: Production applications, large projects

### MySQL
- **Pros**: Widely used, good performance
- **Cons**: Requires separate installation
- **Use Case**: Existing MySQL infrastructure

---

## Common Installation Issues

### Issue 1: Node.js Version Incompatibility

**Problem**: Error about unsupported Node.js version

**Solution**:
```bash
# Check current version
node -v

# If using unsupported version, switch with NVM
nvm install 20
nvm use 20
```

### Issue 2: Permission Errors (macOS/Linux)

**Problem**: `EACCES` permission errors when installing packages

**Solution**:
```bash
# Option 1: Use a Node version manager (recommended)
# NVM installs packages in user directory

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Issue 3: Port Already in Use

**Problem**: Port 1337 is already in use

**Solution**:
```bash
# Option 1: Change port in .env file
PORT=1338

# Option 2: Kill process using port 1337
# macOS/Linux
lsof -ti:1337 | xargs kill -9

# Windows
netstat -ano | findstr :1337
taskkill /PID <PID> /F
```

### Issue 4: Database Connection Errors

**Problem**: Cannot connect to database

**Solution**:
- Verify database is running
- Check database credentials in `.env` file
- Ensure database exists (for PostgreSQL/MySQL)
- Check network/firewall settings

---

## Post-Installation Checklist

After successful installation, verify:

- [ ] Strapi admin panel opens at `http://localhost:1337/admin`
- [ ] Admin user account created successfully
- [ ] No errors in terminal/console
- [ ] Database connection established
- [ ] Can access admin panel dashboard

---

## Next Steps

After installation:

1. **Explore the Admin Panel**: Familiarize yourself with the interface
2. **Review Project Structure**: Understand the folder organization
3. **Read Architecture Overview**: Learn how Strapi is structured
4. **Configure Environment**: Set up environment variables

---

## Version Information

**Documented Versions:**
- Strapi: Latest (check with `npx create-strapi@latest --version`)
- Node.js: v20.x or v22.x (LTS)
- npm: v6.x or higher

**Last Updated**: [Date will be updated during project]

---

## References

- [Official Strapi Documentation](https://docs.strapi.io)
- [Strapi Quick Start Guide](https://docs.strapi.io/dev-docs/quick-start)
- [Strapi GitHub Repository](https://github.com/strapi/strapi)
- [Node.js LTS Schedule](https://nodejs.org/en/about/releases/)

---

## Notes and Decisions

### Decisions Made During Installation

1. **Installation Method**: Using `npx create-strapi@latest` for simplicity
2. **Database Choice**: SQLite for initial development, PostgreSQL for production
3. **Node Version**: Using Node.js v20 LTS for compatibility

### Assumptions

- Development environment is macOS/Linux (commands may differ for Windows)
- User has basic command-line knowledge
- Internet connection available for package downloads

### Limitations Encountered

- Node.js v23 is not supported (requires LTS versions)
- Some features may require additional plugins
- Production deployment requires additional configuration

