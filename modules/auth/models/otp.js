const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Otp = sequelize.define('Otp', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    codeHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    channel: {
      type: DataTypes.ENUM('email', 'whatsapp'),
      allowNull: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    consumedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'otps',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['user_id', 'expires_at']
      }
    ]
  });

  Otp.associate = (models) => {
    Otp.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Otp;
};
