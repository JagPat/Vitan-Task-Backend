const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        is: /^\+[1-9]\d{1,14}$/ // E.164 format validation
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'member'),
      defaultValue: 'member',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'disabled'),
      defaultValue: 'pending',
      allowNull: false
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['phone']
      },
      {
        fields: ['status']
      },
      {
        fields: ['invited_by']
      }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Otp, { foreignKey: 'userId', as: 'otps' });
    User.belongsTo(User, { foreignKey: 'invitedBy', as: 'invitedByUser' });
    User.hasMany(User, { foreignKey: 'invitedBy', as: 'invitedUsers' });
  };

  return User;
};
