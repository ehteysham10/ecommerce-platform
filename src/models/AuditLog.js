import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        action: {
            type: String,
            required: true,
        },
        targetType: {
            type: String,
            required: true,
            enum: ['User', 'Product', 'Order', 'Review'],
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        details: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
