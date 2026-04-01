-- Drop tables if they exist
DROP TABLE IF EXISTS invoice;
DROP TABLE IF EXISTS event_detail;
DROP TABLE IF EXISTS client;
DROP TABLE IF EXISTS owner;
DROP TABLE IF EXISTS users;

-- Drop custom type if it exists
DROP TYPE IF EXISTS user_role;

CREATE TYPE user_role AS ENUM ('Client', 'Owner');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL
);

CREATE TABLE owner (
    owner_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100),
    phone_number VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE client (
    client_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE event_detail (
    event_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    event_type VARCHAR(50),
    event_date DATE,
    event_location VARCHAR(150),
    status VARCHAR(50),
    FOREIGN KEY (client_id) REFERENCES client(client_id)
);

CREATE TABLE invoice (
    invoice_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    event_id INT NOT NULL,
    status VARCHAR(50),
    FOREIGN KEY (client_id) REFERENCES client(client_id),
    FOREIGN KEY (event_id) REFERENCES event_detail(event_id)
);


-- Seed Data

INSERT INTO users (username, password, role) VALUES
('admin',      'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Owner'),
('jane_smith', '186474c1f2c2f735a54c2cf82ee8e87f2a5cd30940e280029363fecedfc5328c', 'Client'),
('bob_jones',  'e56b37a242a602bed629c6087c648f8ac1f1772dc3d51b90bc23fc71aea72f34', 'Client');

INSERT INTO owner (user_id, firstname, lastname, email, phone_number) VALUES
(1, 'Admin', 'Owner', 'info@visionrealizedevents.com', '8622150186');

INSERT INTO client (user_id, firstname, lastname, email, phone_number, date_of_birth) VALUES
(2, 'Jane', 'Smith', 'jane.smith@email.com', '5551234567', '1990-06-15'),
(3, 'Bob',  'Jones', 'bob.jones@email.com',  '5559876543', '1985-11-22');

INSERT INTO event_detail (client_id, event_type, event_date, event_location, status) VALUES
(1, 'Birthday Party',  '2026-05-10', '123 Party Blvd, Newark, NJ', 'Confirmed'),
(2, 'Corporate Event', '2026-06-20', '456 Business Ave, New York, NY', 'Pending');

INSERT INTO invoice (client_id, event_id, status) VALUES
(1, 1, 'Paid'),
(2, 2, 'Pending');
