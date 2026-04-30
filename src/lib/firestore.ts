import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types/auth';

export const createUserDocument = async (userData: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const getUserDocument = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user document:', error);
    throw error;
  }
};

export const updateUserDocument = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

export const findUserByPhoneNumber = async (phoneNumber: string): Promise<User | null> => {
  try {
    // This would typically require a compound query or separate index
    // For now, we'll use a simple approach with a phone numbers collection
    const phoneRef = doc(db, 'phoneNumbers', phoneNumber);
    const phoneDoc = await getDoc(phoneRef);
    
    if (phoneDoc.exists()) {
      const uid = phoneDoc.data().uid;
      return await getUserDocument(uid);
    }
    return null;
  } catch (error) {
    console.error('Error finding user by phone number:', error);
    throw error;
  }
};

export const createPhoneNumberMapping = async (phoneNumber: string, uid: string): Promise<void> => {
  try {
    const phoneRef = doc(db, 'phoneNumbers', phoneNumber);
    await setDoc(phoneRef, {
      uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating phone number mapping:', error);
    throw error;
  }
};
