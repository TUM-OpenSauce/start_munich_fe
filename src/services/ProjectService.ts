import { ApiClient, type Project, type ProjectDTO } from "./ApiService";

// Mock function to simulate an API request delay
const mockApiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ProjectService {

    async getProjects(): Promise<Project[]> {
        const apiClient = new ApiClient();
        
        const projects = await apiClient.getProjects();
        return projects;
    }

    /**
     * Simulates fetching a single project by ID.
     */
    async getProjectById(projectId: string): Promise<Project | null> {
        const apiClient = new ApiClient();
        
        const project = await apiClient.getProject(projectId);
        
        return project || null;
    }

    /**
     * Creates a new project.
     */
    async createProject(data: { name: string; description: string; ownerId: string }): Promise<Project> {
        const apiClient = new ApiClient();
        
        const newProject: ProjectDTO = {
            buyerId: data.ownerId,
            name: data.name,
            description: data.description,
        };
        
        const projectNow = await apiClient.createProject(newProject);
        console.log('[ProjectService] Created new project:', newProject);
        
        return projectNow;
    }

}