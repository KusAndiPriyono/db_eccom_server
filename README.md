# DB E-Commerce Server

This project is an exercise in creating a backend application using Node.js and Express, designed for use with mobile applications built with the Flutter framework.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features

- RESTful API endpoints for e-commerce functionalities
- User authentication and authorization
- Product management
- Order processing
- Integration with a database

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/KusAndiPriyono/db_eccom_server.git
   cd db_eccom_server
   ```
2. Set up environment variables:

   Create a `.env` file in the root directory and add the necessary environment variables as shown in the `.env.example` file.

3. Start the server:
   ```sh
   npm start
   ```
   or
   ```sh
   npm run start
   ```

## Usage

After setting up and starting the server, you can interact with the API endpoints using tools like Postman or through your Flutter mobile application.

## Project Structure

      db_eccom_server/
      ├── node_modules/
      ├── src/
      │   ├── controllers/
      │   ├── models/
      │   ├── routes/
      │   ├── services/
      │   ├── utils/
      │   └── index.js
      ├── .env.example
      ├── package.json
      └── README.md
