CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pools (
    pool_id INT AUTO_INCREMENT PRIMARY KEY,
    pool_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    pool_balance DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE pool_members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    pool_id INT NOT NULL,
    user_id INT NOT NULL,
    contribution DECIMAL(10,2) DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) NOT NULL,
    FOREIGN KEY (pool_id) REFERENCES pools(pool_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT, -- ID of the sender if it's a person, NULL for pool-to-pool or pool-to-person
    to_user_id INT, -- ID of the receiver if it's a person, NULL for pool-to-pool or person-to-pool transaction
    from_pool_id INT, -- ID of the sender pool if it's a pool, NULL for person-to-person or person-to-pool transactions
    to_pool_id INT, -- ID of the receiving pool if it's a pool, NULL for person-to-person or pool-to-person transactions
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    transaction_type ENUM('person_to_person', 'person_to_pool', 'pool_to_person', 'pool_to_pool', 'contribution') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(user_id),
    FOREIGN KEY (to_user_id) REFERENCES users(user_id),
    FOREIGN KEY (from_pool_id) REFERENCES pools(pool_id),
    FOREIGN KEY (to_pool_id) REFERENCES pools(pool_id)
);
