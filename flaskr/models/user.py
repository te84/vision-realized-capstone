class User:
    def __init__(self, user_id, username, password, role):
        self.user_id  = user_id
        self.username = username
        self.password = password
        self.role     = role

    def to_dict(self):
        return {
            'user_id':  self.user_id,
            'username': self.username,
            'role':     self.role,
        }

    @staticmethod
    def from_db_row(row):
        if not row:
            return None
        return User(
            user_id  = row['user_id'],
            username = row['username'],
            password = row['password'],
            role     = row['role'],
        )