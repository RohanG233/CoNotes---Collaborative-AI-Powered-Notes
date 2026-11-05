import mongoose, { Document, Model } from 'mongoose'

export interface INote extends Document {
  title: string
  content: string
  owner: mongoose.Types.ObjectId
  collaborators: mongoose.Types.ObjectId[]
  starred: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const noteSchema = new mongoose.Schema<INote>(
  {
    title: {
      type: String,
      default: 'Untitled note',
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: { type: String, default: '' },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must belong to a user'],
      index: true,
    },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    starred: { type: Boolean, default: false },
    tags: {
      type: [String],
      validate: {
        validator: (arr: string[]) => arr.length <= 10,
        message: 'A note can have at most 10 tags',
      },
    },
  },
  { timestamps: true }
)

noteSchema.index({ owner: 1, updatedAt: -1 })
noteSchema.index({ title: 'text', content: 'text' })

const Note: Model<INote> = mongoose.model<INote>('Note', noteSchema)
export default Note
