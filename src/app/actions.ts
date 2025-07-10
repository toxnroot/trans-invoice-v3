"use server";

import { db } from "@/lib/firebase";
import { Invoice, Product, UserProfile } from "@/lib/types";
import { collection, addDoc, updateDoc, doc, runTransaction, getDoc, deleteDoc, DocumentReference, writeBatch, getDocs, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { revalidatePath } from "next/cache";

// Helper to revalidate cache
const revalidate = () => revalidatePath('/');
const revalidateSuggestions = () => revalidatePath('/admin/suggestions');

export async function createOrUpdateInvoice(invoiceId: string | null, data: Partial<Invoice>): Promise<Invoice> {
    try {
        if (invoiceId) {
            // Update existing invoice
            const invoiceRef = doc(db, 'invoices', invoiceId);
            await updateDoc(invoiceRef, data);
            revalidate();
            const updatedDoc = await getDoc(invoiceRef);
            return { ...updatedDoc.data(), id: updatedDoc.id } as Invoice;
        } else {
            // Create new invoice
            const lastInvoiceNumberRef = doc(db, 'metadata', 'lastInvoiceNumber');

            const newInvoiceRef = await runTransaction(db, async (transaction) => {
                const lastInvoiceNumberDoc = await transaction.get(lastInvoiceNumberRef);
                const lastInvoiceNumber = lastInvoiceNumberDoc.exists() ? lastInvoiceNumberDoc.data().value : 0;
                const newInvoiceNumber = lastInvoiceNumber + 1;

                const newInvoiceData = {
                    ...data,
                    invoiceNumber: newInvoiceNumber,
                };
                
                const newDocRef = doc(collection(db, "invoices"));
                transaction.set(newDocRef, newInvoiceData);
                transaction.set(lastInvoiceNumberRef, { value: newInvoiceNumber });
                return newDocRef;
            });
            revalidate();
            const newDoc = await getDoc(newInvoiceRef);
            return { ...newDoc.data(), id: newDoc.id } as Invoice;
        }
    } catch (error) {
        console.error("Error in createOrUpdateInvoice: ", error);
        throw new Error("Failed to save invoice.");
    }
}


export async function updateInvoiceStatus(invoiceId: string, status: { isCompleted?: boolean, isTransfer?: boolean }) {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, status);
    revalidate();
}

export async function updateInvoiceNote(invoiceId: string, note: string) {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, { note });
    revalidate();
}

export async function deleteInvoice(invoiceId: string) {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const lastInvoiceNumberRef = doc(db, 'metadata', 'lastInvoiceNumber');

    await runTransaction(db, async (transaction) => {
        const invoiceToDeleteDoc = await transaction.get(invoiceRef);
        if (!invoiceToDeleteDoc.exists()) {
            throw new Error("Invoice to delete was not found.");
        }
        const deletedInvoiceNumber = invoiceToDeleteDoc.data().invoiceNumber;

        const lastInvoiceNumberDoc = await transaction.get(lastInvoiceNumberRef);
        const lastInvoiceNumber = lastInvoiceNumberDoc.exists() ? lastInvoiceNumberDoc.data().value : 0;

        if (deletedInvoiceNumber === lastInvoiceNumber && lastInvoiceNumber > 0) {
            transaction.set(lastInvoiceNumberRef, { value: lastInvoiceNumber - 1 });
        }

        transaction.delete(invoiceRef);
    });

    revalidate();
}

export async function addProductToInvoice(invoiceId: string, productData: Omit<Product, 'id' | 'total'>): Promise<Product[]> {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const newProduct: Product = {
        ...productData,
        id: Date.now(),
        total: productData.price * productData.meter,
    };
    
    const invoiceDoc = await getDoc(invoiceRef);
    const currentProducts = invoiceDoc.data()?.products || [];
    const updatedProducts = [...currentProducts, newProduct];

    await updateDoc(invoiceRef, { products: updatedProducts });
    revalidate();
    return updatedProducts;
}

export async function updateProductInInvoice(invoiceId: string, productIndex: number, productData: Omit<Product, 'id' | 'total'>): Promise<Product[]> {
    const invoiceRef = doc(db, 'invoices', invoiceId);

    const invoiceDoc = await getDoc(invoiceRef);
    const currentProducts = invoiceDoc.data()?.products || [];
    
    const productToUpdate = currentProducts[productIndex];
    if(!productToUpdate) throw new Error("Product not found");

    const updatedProduct: Product = {
        ...productData,
        id: productToUpdate.id, // Keep original ID
        total: productData.price * productData.meter,
    };

    currentProducts[productIndex] = updatedProduct;
    
    await updateDoc(invoiceRef, { products: currentProducts });
    revalidate();
    return currentProducts;
}

export async function deleteProductFromInvoice(invoiceId: string, productIndex: number): Promise<Product[]> {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);
    const currentProducts = invoiceDoc.data()?.products || [];

    const updatedProducts = currentProducts.filter((_: any, index: number) => index !== productIndex);
    
    await updateDoc(invoiceRef, { products: updatedProducts });
    revalidate();
    return updatedProducts;
}

export async function backupInvoices(): Promise<string> {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    const invoices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return JSON.stringify(invoices, null, 2);
}

export async function restoreInvoices(invoicesJSON: string): Promise<{count: number}> {
    const invoices: Invoice[] = JSON.parse(invoicesJSON);
    if (!Array.isArray(invoices)) {
        throw new Error("Invalid JSON file format.");
    }
    
    const batch = writeBatch(db);
    invoices.forEach(invoice => {
        const docRef = doc(db, "invoices", invoice.id);
        batch.set(docRef, invoice);
    });

    await batch.commit();
    revalidate();
    return { count: invoices.length };
}

export async function deleteAllInvoices() {
    const batch = writeBatch(db);
    const querySnapshot = await getDocs(collection(db, "invoices"));
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    const metadataRef = doc(db, 'metadata', 'lastInvoiceNumber');
    batch.set(metadataRef, { value: 0 });
    
    await batch.commit();
    revalidate();
}

export async function createUserProfile(data: { uid: string, name: string, email: string }) {
    const { uid, name, email } = data;
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
        uid: uid,
        name: name,
        email: email,
        role: 'deploy' // Default role for new users
    });
}

export async function getAllUsers(): Promise<UserProfile[]> {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    return users;
}

export async function updateUserRole(targetUserId: string, newRole: 'admin' | 'deploy'): Promise<void> {
    // NOTE: In a production app, you would add server-side checks
    // to ensure the calling user is an admin.
    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, { role: newRole });
    revalidatePath('/admin/users');
}

export async function getSuggestions(collectionId: 'nametextile' | 'colors'): Promise<string[]> {
    const docRef = doc(db, "dropdown", collectionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure fields is an array and sort it
        return Array.isArray(data.fields) ? data.fields.sort() : [];
    }
    return [];
}

export async function addSuggestion(collectionId: 'nametextile' | 'colors', newValue: string): Promise<void> {
    if (!newValue.trim()) {
        throw new Error("Suggestion value cannot be empty.");
    }
    const docRef = doc(db, "dropdown", collectionId);
    
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, { fields: [newValue.trim()] });
    } else {
        await updateDoc(docRef, {
            fields: arrayUnion(newValue.trim())
        });
    }
    revalidateSuggestions();
}

export async function deleteSuggestion(collectionId: 'nametextile' | 'colors', valueToDelete: string): Promise<void> {
    const docRef = doc(db, "dropdown", collectionId);
    await updateDoc(docRef, {
        fields: arrayRemove(valueToDelete)
    });
    revalidateSuggestions();
}