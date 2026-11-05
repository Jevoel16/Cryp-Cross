import './App.css';
import { useState, useEffect, useRef, useCallback } from 'react';
// Import necessary components from react-router-dom
import { BrowserRouter, Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from './config';
import usePageMeta from './usePageMeta';

// --- MOCK PROJECT DATA ---
// NEW: Mock project data array
const PROJECT_LOG = [
    { id: 1, title: "Initial Project Setup", status: "Complete", priority: "High", description: "Set up React project, install dependencies, and define core components (App, NavBar, Footer)." },
    { id: 2, title: "Theme Toggle Functionality", status: "Complete", priority: "Medium", description: "Implement light/dark mode state and persistence using localStorage." },
    { id: 3, title: "React Router Implementation", status: "Complete", priority: "High", description: "Integrate BrowserRouter, Routes, and define basic page structure and links." },
    { id: 4, title: "Team Carousel Component", status: "Complete", priority: "Medium", description: "Develop a functional component with state for image switching and auto-play." },
    { id: 5, title: "Project Log Feature Development", status: "Complete", priority: "High", description: "Implement ProjectList, ProjectDetail, and state management for project log items." },
    { id: 6, title: "Responsive Layout Adjustments", status: "Pending", priority: "Medium", description: "Review and refine all media queries to ensure optimal display on mobile devices." },
    { id: 7, title: "Final Code Review and Refactor", status: "Pending", priority: "Low", description: "Clean up code, ensure prop-types are considered (though not strictly required), and finalize comments." }
];

// Team member data is moved from script.js into the React component file
const TEAM_MEMBERS = [
    // Root-relative paths so images also load on nested routes.
    { name: "Jev", role: "Project Lead", img: "/img/pic1.webp" },
    { name: "Jev", role: "Front-End Specialist", img: "/img/pic2.webp" },
    { name: "Jev", role: "Back-End Specialist", img: "/img/pic1.webp" },
    { name: "Jev", role: "Database Administrator", img: "/img/pic2.webp" },
    { name: "Jev, Mark, & Al", role: "Quality Tester", img: "/img/pic3.webp" }
];

// --- UTILITY FUNCTION ---
// Maps a status string to a CSS class defined in App.css
const getStatusClass = (status) => {
    switch (status) {
        case 'Pending': return 'status-pending';
        case 'InProgress': return 'status-inprogress';
        case 'Complete': return 'status-complete';
        default: return '';
    }
};

// --- 1. Functional Component: NavBar (Refactored Header for Routing) ---
const NavBar = ({ isDark, onToggleTheme }) => {
    // useLocation hook provides access to the current URL path for setting the active link class
    const location = useLocation(); 

    // Navigation items now use 'path' for routing
    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/idea', label: 'Idea' },
        { path: '/team', label: 'Team' },
        // NEW: Added Project Log link
        { path: '/projects', label: 'Project Log' }, 
    ];

    const themeIcon = isDark ? '☀️ Light' : '🌙 Dark';

    return (
        <header>
            <nav id="navigator">
                <ul className="tabs">
                    {navItems.map((item) => (
                        <li key={item.path} className="tab-item">
                            {/* Replaced <a> with <Link> for routing */}
                            <Link
                                to={item.path}
                                // Sets the 'active' class based on the current URL path.
                                // Uses startsWith for the /projects route to keep it active for sub-routes.
                                className={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <button id="themeToggle" onClick={onToggleTheme} aria-label="Toggle light and dark mode">
                {themeIcon}
            </button>
        </header>
    );
};

// --- 2. Functional Component: SectionWrapper (Previously ProjectCard) ---
// Used as a consistent wrapper for all page content
const SectionWrapper = ({ title, children, className = '' }) => (
    <section className={`tab-content content-visible ${className}`}>
        {title && <h1>{title}</h1>}
        {children}
    </section>
);

// --- 3. Functional Component: Footer ---
const Footer = () => (
    <footer>
        <p>&copy; 2025 Cryp-Cross Team 🧩</p>
    </footer>
);

// --- 4. Functional Component: TeamCarousel (Complex Content) ---
// (No changes here, retained as is)
const TeamCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const autoSwitchRef = useRef(null);

    const currentMember = TEAM_MEMBERS[currentIndex];

    const startAutoSwitch = useCallback(() => {
        if (autoSwitchRef.current) clearInterval(autoSwitchRef.current);
        autoSwitchRef.current = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % TEAM_MEMBERS.length);
        }, 4000);
    }, []);

    const goToNext = (manual = false) => {
        if (manual && autoSwitchRef.current) clearInterval(autoSwitchRef.current);
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % TEAM_MEMBERS.length);
            setIsFading(false);
            if (manual) startAutoSwitch();
        }, 500);
    };

    const goToPrev = () => {
        if (autoSwitchRef.current) clearInterval(autoSwitchRef.current);
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex - 1 + TEAM_MEMBERS.length) % TEAM_MEMBERS.length);
            setIsFading(false);
            startAutoSwitch();
        }, 500);
    };

    useEffect(() => {
        startAutoSwitch();
        // Cleanup function: clears interval when component unmounts
        return () => {
            if (autoSwitchRef.current) clearInterval(autoSwitchRef.current);
        };
    }, [startAutoSwitch]);

    return (
        <>
            <div id="teamContainer">
                <button id="prevTeamBtn" onClick={goToPrev}>&#8592;</button>
                <div id="teamProfile" className={isFading ? 'fade-out' : ''}>
                    <img
                        id="teamImage"
                        src={currentMember.img}
                        alt={`${currentMember.name}, ${currentMember.role}`}
                        width="200"
                        height="200"
                        decoding="async"
                    />
                    <div id="teamText">
                        <h2 id="teamName">{currentMember.name}</h2>
                        <p id="teamRole">{currentMember.role}</p>
                    </div>
                </div>
                <button id="nextTeamBtn" onClick={() => goToNext(true)}>&#8594;</button>
            </div>
            &nbsp;
        </>
    );
};

// --- 5. Project Log Feature Components ---

// NEW: Create Project Form Component
const CreateProjectForm = ({ onCreateProject }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Pending'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.description.trim()) {
            setMessage({ type: 'error', text: 'Title and description are required' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        const result = await onCreateProject(formData);

        if (result.success) {
            setMessage({ type: 'success', text: 'Project created successfully!' });
            setFormData({ title: '', description: '', status: 'Pending' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to create project' });
        }

        setIsSubmitting(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <article className="create-form">
            <h2>Create New Project</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter project title"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter project description"
                        rows="4"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="status">Status:</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    >
                        <option value="Pending">Pending</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Complete">Complete</option>
                    </select>
                </div>
                <button type="submit" disabled={isSubmitting} className="submit-btn">
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
                {message && (
                    <p className={`form-message ${message.type}`}>
                        {message.text}
                    </p>
                )}
            </form>
        </article>
    );
};

// NEW: Project List Component
const ProjectList = ({ projects, onUpdateStatus, onDeleteProject }) => {
    return (
        <article>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Current Task Log</h2>
                <Link to="/projects/new" className="primary-btn">+ Create New Project</Link>
            </div>
            <table className="project-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center' }}>
                                No projects found. Create one above!
                            </td>
                        </tr>
                    ) : (
                        projects.map((project, index) => (
                            <tr key={project.id}>
                                <td>{index + 1}</td>
                                <td>{project.title}</td>
                                <td>
                                    {/* Dynamically assigns a CSS class based on status */}
                                    <span className={getStatusClass(project.status)}>
                                        {project.status}
                                    </span>
                                </td>
                                <td>
                                    {/* Link to the detail view */}
                                    <Link to={`/projects/${project.id}`} className="details-link">
                                        View Detail
                                    </Link>
                                    {' | '}
                                    {/* Button to change status, calling the parent's callback prop */}
                                    <button onClick={() => onUpdateStatus(project.id, project.status)}>
                                        Change Status
                                    </button>
                                    {' | '}
                                    {/* Delete button */}
                                    <button 
                                        onClick={() => onDeleteProject(project.id)}
                                        className="delete-btn"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </article>
    );
};

// NEW: Project Detail Component
const ProjectDetail = ({ projects }) => {
    // Hooks to get ID from URL and navigate back
    const { id } = useParams();
    const navigate = useNavigate();

    // URL params are strings; fallback data uses numeric ids, MongoDB uses string ids.
    const index = projects.findIndex(p => String(p.id) === id);
    const project = projects[index];
    const displayIndex = index + 1;

    usePageMeta({
        title: project ? project.title : 'Project Not Found',
        description: project ? project.description.slice(0, 155) : 'This project could not be found in the Cryp-Cross Project Log.',
        noindex: true,
    });

    if (!project) {
        return (
            <SectionWrapper title="Project Not Found">
                <p>No project found with ID: <strong>{id}</strong>.</p>
                <p><Link to="/projects">Go back to the list</Link></p>
            </SectionWrapper>
        );
    }

    // Display the details of the selected project
    return (
        <SectionWrapper title={`Project #${displayIndex}: ${project.title}`}>
            <article>
                &nbsp;
                <p><strong>Priority:</strong> {project.priority}</p>
                &nbsp;
                <p>
                    <strong>Status:</strong> 
                    <span className={`status-display ${getStatusClass(project.status)}`}>
                        {project.status}
                    </span>
                </p>
                &nbsp;
                <h2>Description</h2>
                &nbsp;
                <p>{project.description}</p>
            </article>
            &nbsp;
            <p style={{ marginTop: '20px' }}>
                <button className='projectButton' onClick={() => navigate('/projects')}>
                    &larr; Back to Project Log
                </button>
            </p>
        </SectionWrapper>
    );
};

// NEW: Project Log Page Component (List-only view)
const ProjectLogPage = ({ projects, loading, onUpdateStatus, onDeleteProject }) => {
    usePageMeta({
        title: 'Project Log',
        description: 'Track Cryp-Cross development tasks: create, update and review project log entries with their status.',
        path: '/projects',
    });

    if (loading) {
        return (
            <SectionWrapper title="Loading...">
                <p>Fetching projects from server...</p>
            </SectionWrapper>
        );
    }

    return (
        <SectionWrapper title="Cryp-Cross Project Log">
            <ProjectList
                projects={projects}
                onUpdateStatus={onUpdateStatus}
                onDeleteProject={onDeleteProject}
            />
        </SectionWrapper>
    );
};

// NEW: Create Project Page Component (separate route)
const CreateProjectPage = ({ onCreateProject }) => {
    const navigate = useNavigate();
    usePageMeta({
        title: 'Create New Project',
        description: 'Add a new entry to the Cryp-Cross Project Log.',
        noindex: true,
    });

    const handleCreateSuccess = async (newProject) => {
        const result = await onCreateProject(newProject);
        if (result.success) {
            // Redirect to task list after successful creation
            navigate('/projects');
        }
        return result;
    };

    return (
        <SectionWrapper title="Create New Project">
            <CreateProjectForm onCreateProject={handleCreateSuccess} />
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/projects" className="primary-btn">
                    ← Back to Task List
                </Link>
            </p>
        </SectionWrapper>
    );
};


// --- 6. Route-Specific Components (Replacing old conditional rendering blocks) ---

const HomePage = () => {
    usePageMeta({
        title: 'Cryp-Cross',
        description: 'Cryp-Cross is a crypto crossword challenge: solve a fresh crossword every day and earn blockchain-based token rewards on a verifiable ledger.',
        path: '/',
    });
    return (
    <SectionWrapper title="Cryp-Cross">
        &nbsp;
        <article>
             &nbsp;
            <p>
                Welcome to Cryp-Cross, the ultimate Crypto Crossword Challenge!
            </p>
             &nbsp;
            <p>
                Cryp-Cross is a next-generation crossword puzzle platform that merges timeless word challenges with the transparency and excitement of <strong>blockchain rewards</strong>. Each day, users can solve fresh crossword puzzles, earn digital tokens for every correct answer, and track their achievements on an immutable, verifiable ledger.
            </p>
             &nbsp;
            <p>
                Designed for both puzzle enthusiasts and tech-savvy players, Cryp-Cross brings together classic gameplay and modern innovation in a secure, interactive environment.
            </p>
             &nbsp;
            <p>
                Explore the <Link to="/idea">project overview and unique features</Link>, and <Link to="/team">meet the team</Link> driving its development.
            </p>
             &nbsp;
        </article>
         &nbsp;
    </SectionWrapper>
    );
};

const IdeaPage = () => {
    usePageMeta({
        title: 'The Idea',
        description: 'The Cryp-Cross idea: daily crosswords, real-time answer validation, leaderboards and tamper-resistant blockchain token rewards.',
        path: '/idea',
    });
    return (
    <SectionWrapper title="Cryp-Cross: The Idea">
        <article>
            <h2>Problem Statement</h2>
            <p>Traditional crossword puzzle platforms, although playable, lack dynamic content and transparent, secure reward systems. This app delivers a new crossword each day with correct entries publicly recorded to prevent duplicate solving. Successful players receive <strong>blockchain-based tokens</strong> as rewards, which can be traded to others.</p>
        </article>
        <article>
            <h2>Key Features</h2>
            <ul>
                <li>Daily Crossword Generation</li>
                <li>User Registration and Authentication</li>
                <li>Real-Time Answer Submission and Validation</li>
                <li>Leaderboard and Progress Tracking</li>
                <li>Blockchain-Based Rewards</li>
                <li>Token Trading System</li>
                <li>Puzzle and User Data Management</li>
            </ul>
        </article>
        <article>
            <h2>Emerging Technology Integration</h2>
            <p>A built-in blockchain ledger records, verifies, and secures each player’s earned puzzle rewards, ensuring every achievement is transparently tracked and tamper-resistant without relying on external platforms. This approach brings trust, verifiability, and accountability to user incentives within the Cryp-Cross ecosystem.</p>
            <p><Link to="/team">Meet the team</Link> building it.</p>
        </article>
    </SectionWrapper>
    );
};

const TeamPage = () => {
    usePageMeta({
        title: 'Team',
        description: 'Meet the Cryp-Cross team: project lead, front-end and back-end specialists, database administrator and quality testers.',
        path: '/team',
    });
    return (
        <SectionWrapper title="Cryp-Cross Team">
            <TeamCarousel />
        </SectionWrapper>
    );
};

const NotFoundPage = () => {
    usePageMeta({
        title: 'Page Not Found',
        description: 'The page you requested does not exist on Cryp-Cross.',
        noindex: true,
    });
    return (
        <SectionWrapper title="404 Not Found">
            <p>The page you requested does not exist. <Link to="/">Go Home</Link></p>
        </SectionWrapper>
    );
};


// Fetches projects from the API, oldest first, mapped for the UI. Falls back to the
// mock PROJECT_LOG when the server is unreachable; returns null if the API reports failure.
const requestProjects = async () => {
    try {
        const response = await fetch(API_ENDPOINTS.PROJECTS);
        const data = await response.json();
        if (!data.success) return null;
        return data.data
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((project) => ({
                id: project._id,
                title: project.title,
                status: project.status,
                priority: 'Medium',
                description: project.description,
            }));
    } catch (error) {
        console.error('Error fetching projects:', error);
        return PROJECT_LOG.slice();
    }
};


// --- Main App Component (Root/Container) ---
const App = () => {
    // State for Theme: read the saved choice on first render instead of setting it in an effect
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    
    // 1. STATE INITIALIZATION: Fetch projects from server
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Applies a fetch result; null means the API answered without data, so keep the current list.
    const applyProjects = (list) => {
        if (list) setProjects(list);
        setLoading(false);
    };

    // Refetch (e.g. after a failed delete): show the loading state again, then load
    const fetchProjects = () => {
        setLoading(true);
        return requestProjects().then(applyProjects);
    };

    // Fetch projects from API on mount (loading already starts as true). State is only set
    // in the promise callback, never synchronously inside the effect.
    useEffect(() => {
        requestProjects().then(applyProjects);
    }, []);

    // CREATE: Add new project
    const handleCreateProject = async (newProject) => {
        try {
            const response = await fetch(API_ENDPOINTS.PROJECTS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProject),
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Add new project to state
                const mappedProject = {
                    id: data.data._id,
                    title: data.data.title,
                    status: data.data.status,
                    priority: 'Medium',
                    description: data.data.description
                };
                setProjects(prevProjects => [mappedProject, ...prevProjects]);
                return { success: true };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            console.error('Error creating project:', error);
            return { success: false, error: 'Failed to create project' };
        }
    };
    
    // UPDATE: Change project status
    const handleUpdateStatus = async (id, currentStatus) => {
        // Define the transition sequence
        const newStatus = 
            currentStatus === 'Pending' ? 'InProgress' :
            currentStatus === 'InProgress' ? 'Complete' : 
            'Pending';

        // Optimistically update UI
        setProjects(prevProjects => 
            prevProjects.map(project => 
                project.id === id ? { ...project, status: newStatus } : project
            )
        );
        
        try {
            const response = await fetch(API_ENDPOINTS.PROJECT_BY_ID(id), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (!response.ok) {
                // Revert on error
                setProjects(prevProjects => 
                    prevProjects.map(project => 
                        project.id === id ? { ...project, status: currentStatus } : project
                    )
                );
                console.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on error
            setProjects(prevProjects => 
                prevProjects.map(project => 
                    project.id === id ? { ...project, status: currentStatus } : project
                )
            );
        }
    };
    
    // DELETE: Remove project
    const handleDeleteProject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) {
            return;
        }
        
        // Optimistically remove from UI
        setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
        
        try {
            const response = await fetch(API_ENDPOINTS.PROJECT_BY_ID(id), {
                method: 'DELETE',
            });
            
            if (!response.ok && response.status !== 204) {
                // Revert on error - would need to refetch or store deleted item
                console.error('Failed to delete project');
                fetchProjects(); // Refetch to restore state
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            fetchProjects(); // Refetch to restore state
        }
    };

    // useEffect hook for initial theme loading and state persistence (Theme logic retained)
    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDark);
    }, [isDark]);

    // Theme Toggle Handler (Retained)
    const handleToggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
        document.body.classList.toggle('dark-mode', newIsDark);
    };

    return (
        // Encapsulate the application with the router
        <BrowserRouter>
            {/* NavBar component handles navigation */}
            <NavBar
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
            />

            <main>
                {/* Routes define which component renders based on the URL */}
                <Routes>
                    {/* Home page route */}
                    <Route path="/" element={<HomePage />} />
                    {/* Idea page route */}
                    <Route path="/idea" element={<IdeaPage />} />
                    {/* Team page route */}
                    <Route path="/team" element={<TeamPage />} />
                    
                    {/* NEW: Project Log List View Route */}
                    {/* Passes both state and the setter function as a callback prop */}
                    <Route 
                        path="/projects" 
                        element={
                            <ProjectLogPage
                                projects={projects}
                                loading={loading}
                                onUpdateStatus={handleUpdateStatus}
                                onDeleteProject={handleDeleteProject}
                            />
                        }
                    />

                    {/* Route for creating a new project */}
                    <Route 
                        path="/projects/new" 
                        element={<CreateProjectPage onCreateProject={handleCreateProject} />} 
                    />

                    {/* NEW: Project Log Detail View Route (uses a URL parameter :id) */}
                    <Route 
                        path="/projects/:id" 
                        element={<ProjectDetail projects={projects} />} 
                    />

                    {/* Optional: Fallback route for 404/No Match */}
                    <Route 
                        path="*" 
                        element={<NotFoundPage />}
                    />
                </Routes>
            </main>

            <Footer />
        </BrowserRouter>
    );
};

export default App;