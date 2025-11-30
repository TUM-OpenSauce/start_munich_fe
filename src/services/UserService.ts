import { auth } from "../firebase";
import { ApiClient, type BuyerRequest } from "./ApiService";

export interface UserProfile {
    username: string;
    email: string;
    company: string;
    userId: string;
    googleId?: string;
}

const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class UserService {

    async getUserProfile(userId: string): Promise<UserProfile | null> {
        await mockApiDelay(500);

        const APIClient = new ApiClient();
        const buyers = await APIClient.getBuyers();
        
        const existingBuyer = buyers.find(b => b.buyerId === userId);

        if (existingBuyer) {
            let UserProfile: UserProfile = {
                username: auth.currentUser?.displayName || existingBuyer.name,
                email: existingBuyer.emailAddress,
                company: existingBuyer.company,
                userId: existingBuyer.buyerId,
            };

            return UserProfile;
        }


        return null;
    }

    async getUserProfileByEmail(emailAddress: string): Promise<UserProfile | null> {
        await mockApiDelay(500);

        const APIClient = new ApiClient();
        const buyers = await APIClient.getBuyers();
        
        const existingBuyer = buyers.find(b => b.emailAddress === emailAddress);
        console.log("Searching for user profile by email:", buyers);
        if (existingBuyer) {
            let UserProfile: UserProfile = {
                username: auth.currentUser?.displayName || existingBuyer.name,
                email: existingBuyer.emailAddress,
                company: existingBuyer.company,
                userId: existingBuyer.buyerId,
            };
            console.log("Found user profile by email:", UserProfile);
            return UserProfile;
        }


        return null;
    }

    async saveUserProfile(profileData: Omit<UserProfile, 'userId'>): Promise<UserProfile> {
        await mockApiDelay(1000);
        
        const APIClient = new ApiClient();
        const newBuyer: BuyerRequest = {
            name: profileData.username,
            emailAddress: profileData.email,
            company: profileData.company,
        };
        let recivedBuyer = await APIClient.createBuyer(newBuyer);
        const newProfile: UserProfile = {
            username: recivedBuyer.name,
            email: recivedBuyer.emailAddress,
            company: recivedBuyer.company,
            userId: recivedBuyer.buyerId,
        };

        return newProfile;
    }


}