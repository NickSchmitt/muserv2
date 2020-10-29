'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class comment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            models.comment.belongsTo(models.user)
        }
    }
    comment.init({
        text: DataTypes.STRING,
        userId: DataTypes.STRING,
        trackId: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'comment',
    })
    return comment
}