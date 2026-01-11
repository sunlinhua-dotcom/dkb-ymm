FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy project files
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port 8080 (Zeabur default as per user request)
EXPOSE 8080

# Start the application on port 8080 (via the updated start script)
CMD ["npm", "run", "start"]
