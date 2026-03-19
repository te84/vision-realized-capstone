DROP DATABASE IF EXISTS vision_realized;
CREATE DATABASE vision_realized;
USE vision_realized;


CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Client','Owner') NOT NULL
);


CREATE TABLE Owner (
    owner_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100),
    phone_number VARCHAR(20),

    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);


CREATE TABLE Client (
    client_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100),
    phone_number VARCHAR(20),
    date_of_birth DATE,

    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Event_detail (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    event_type VARCHAR(50),
    event_date DATE,
    event_location VARCHAR(150),
    status VARCHAR(50),

    FOREIGN KEY (client_id) REFERENCES Client(client_id)
);

CREATE TABLE Invoice (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    event_id INT NOT NULL,
    status VARCHAR(50),

    FOREIGN KEY (client_id) REFERENCES Client(client_id),
    FOREIGN KEY (event_id) REFERENCES Event_detail(event_id)
);

