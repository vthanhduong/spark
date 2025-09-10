# Frontend Dockerfile for development
FROM node:22.12-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend code
COPY . .

# Expose port
EXPOSE 5173

# Command will be overridden by docker-compose
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
