-- 🗄️ WhatsTask Database Schema
-- Dynamic Role-Based Access Control System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with dynamic roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    login_method VARCHAR(50) NOT NULL DEFAULT 'google',
    google_id VARCHAR(255) UNIQUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for JWT management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User permissions (extensible permission system)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    UNIQUE(role, permission_id)
);

-- Audit log for role changes
CREATE TABLE role_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    old_role VARCHAR(50),
    new_role VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
-- User permissions
('read', 'Basic read access', 'basic'),
('write', 'Basic write access', 'basic'),
('create_tasks', 'Create new tasks', 'tasks'),
('view_dashboard', 'View user dashboard', 'dashboard'),

-- Admin permissions
('admin', 'Full administrative access', 'admin'),
('manage_users', 'Manage user accounts and roles', 'admin'),
('system_settings', 'Access system configuration', 'admin'),
('delete', 'Delete resources', 'admin'),
('moderate', 'Moderate content and users', 'moderation');

-- Insert default role permissions
INSERT INTO role_permissions (role, permission_id) 
SELECT 'user', id FROM permissions WHERE name IN ('read', 'write', 'create_tasks', 'view_dashboard');

INSERT INTO role_permissions (role, permission_id) 
SELECT 'admin', id FROM permissions;

INSERT INTO role_permissions (role, permission_id) 
SELECT 'moderator', id FROM permissions WHERE name IN ('read', 'write', 'moderate', 'view_dashboard');

-- Insert default admin user (you can change this email)
INSERT INTO users (email, name, role, status, login_method) VALUES
('jagrutpatel@gmail.com', 'Jagrut Patel', 'admin', 'active', 'google')
ON CONFLICT (email) DO UPDATE SET 
    role = 'admin',
    status = 'active',
    updated_at = CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_audit_log_user_id ON role_audit_log(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(user_email VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role FROM users WHERE email = user_email AND status = 'active';
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = user_role AND p.name = permission_name
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_email VARCHAR)
RETURNS TABLE(permission_name VARCHAR, category VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.category
    FROM users u
    JOIN role_permissions rp ON u.role = rp.role
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.email = user_email AND u.status = 'active';
END;
$$ LANGUAGE plpgsql;
