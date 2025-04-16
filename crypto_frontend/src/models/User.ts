
import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the user document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  date: Date;
}

// Create the user schema
const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// In a real application, you would connect to MongoDB here
// const User = mongoose.model<IUser>('User', UserSchema);

// For demonstration purposes only
const User = {
  // Mock function to find a user by email
  findOne: async ({ email }: { email: string }) => {
    if (email === 'demo@example.com') {
      return {
        _id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        password: '$2a$10$X7X3hcZLDzbvzRjnnUk0L.jZzr0sK.BK4LV4sVpwGI3xmVG3QvHHS', // hashed 'password'
        isAdmin: false,
        date: new Date()
      };
    }
    return null;
  },
  
  // Mock function to create a new user
  create: async (userData: Partial<IUser>) => {
    return {
      _id: Math.random().toString(36).substr(2, 9),
      ...userData,
      isAdmin: false,
      date: new Date()
    };
  }
};

export default User;
