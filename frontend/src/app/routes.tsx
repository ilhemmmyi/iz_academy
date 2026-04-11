import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CoachGuard } from "./components/CoachGuard";

// Lazy-loaded public pages
const CoursesPage = lazy(() => import("./pages/CoursesPage").then(m => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage").then(m => ({ default: m.CourseDetailPage })));
const FAQ = lazy(() => import("./pages/FAQ").then(m => ({ default: m.FAQ })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const UserProfile = lazy(() => import("./pages/UserProfile").then(m => ({ default: m.UserProfile })));
const Verify2FA = lazy(() => import("./pages/Verify2FA").then(m => ({ default: m.Verify2FA })));

// Lazy-loaded student pages
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard").then(m => ({ default: m.StudentDashboard })));
const StudentCourses = lazy(() => import("./pages/student/StudentCourses").then(m => ({ default: m.StudentCourses })));
const StudentCourseView = lazy(() => import("./pages/student/StudentCourseView").then(m => ({ default: m.StudentCourseView })));
const StudentQuiz = lazy(() => import("./pages/student/StudentQuiz").then(m => ({ default: m.StudentQuiz })));
const StudentProjects = lazy(() => import("./pages/student/StudentProjects").then(m => ({ default: m.StudentProjects })));
const StudentMessages = lazy(() => import("./pages/student/StudentMessages").then(m => ({ default: m.StudentMessages })));
const StudentCertificates = lazy(() => import("./pages/student/StudentCertificates").then(m => ({ default: m.StudentCertificates })));
const StudentCertificateDetail = lazy(() => import("./pages/student/StudentCertificateDetail").then(m => ({ default: m.StudentCertificateDetail })));
const CareerChatbot = lazy(() => import("./pages/student/CareerChatbot").then(m => ({ default: m.CareerChatbot })));

// Lazy-loaded teacher pages
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard").then(m => ({ default: m.TeacherDashboard })));
const TeacherStudents = lazy(() => import("./pages/teacher/TeacherStudents").then(m => ({ default: m.TeacherStudents })));
const TeacherMessages = lazy(() => import("./pages/teacher/TeacherMessages").then(m => ({ default: m.TeacherMessages })));
const TeacherCourses = lazy(() => import("./pages/teacher/TeacherCourses").then(m => ({ default: m.TeacherCourses })));
const TeacherCourseView = lazy(() => import("./pages/teacher/TeacherCourseView").then(m => ({ default: m.TeacherCourseView })));
const TeacherProjects = lazy(() => import("./pages/teacher/TeacherProjects").then(m => ({ default: m.TeacherProjects })));

// Lazy-loaded admin pages
const AdminCreateCourse = lazy(() => import("./pages/admin/AdminCreateCourse").then(m => ({ default: m.AdminCreateCourse })));
const AdminEditCourse = lazy(() => import("./pages/admin/AdminEditCourse").then(m => ({ default: m.AdminEditCourse })));
const AdminCourseView = lazy(() => import("./pages/admin/AdminCourseView").then(m => ({ default: m.AdminCourseView })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses").then(m => ({ default: m.AdminCourses })));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories").then(m => ({ default: m.AdminCategories })));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments").then(m => ({ default: m.AdminPayments })));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings").then(m => ({ default: m.AdminSettings })));
const AdminEnrollmentRequests = lazy(() => import("./pages/admin/AdminEnrollmentRequests").then(m => ({ default: m.AdminEnrollmentRequests })));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages").then(m => ({ default: m.AdminContactMessages })));
const AdminReports = lazy(() => import("./pages/admin/AdminReports").then(m => ({ default: m.AdminReports })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

/** Wraps a lazy page in Suspense + ProtectedRoute */
const Guard = ({ roles, children }: { roles: string[]; children: React.ReactNode }) => (
  <ProtectedRoute roles={roles}>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ProtectedRoute>
);

/** Same as Guard but also blocks non-coach-completed students */
const StudentGuard = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute roles={["STUDENT"]}>
    <CoachGuard>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </CoachGuard>
  </ProtectedRoute>
);

export const router = createBrowserRouter([
  // Eager — always in the initial bundle
  { path: "/", Component: LandingPage },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  {
    path: "/verify-2fa",
    element: <Suspense fallback={<PageLoader />}><Verify2FA /></Suspense>,
  },

  // Lazy public pages
  {
    path: "/faq",
    element: <Suspense fallback={<PageLoader />}><FAQ /></Suspense>,
  },
  {
    path: "/contact",
    element: <Suspense fallback={<PageLoader />}><Contact /></Suspense>,
  },
  {
    path: "/profile",
    element: <Suspense fallback={<PageLoader />}><UserProfile /></Suspense>,
  },
  {
    path: "/courses",
    element: <Suspense fallback={<PageLoader />}><CoursesPage /></Suspense>,
  },
  {
    path: "/course/:id",
    element: <Suspense fallback={<PageLoader />}><CourseDetailPage /></Suspense>,
  },

  // Student Routes
  { path: "/student", element: <StudentGuard><StudentDashboard /></StudentGuard> },
  { path: "/student/courses", element: <StudentGuard><StudentCourses /></StudentGuard> },
  { path: "/student/course/:courseId", element: <StudentGuard><StudentCourseView /></StudentGuard> },
  { path: "/student/quiz/:courseId", element: <StudentGuard><StudentQuiz /></StudentGuard> },
  { path: "/student/quiz/:courseId/:lessonId", element: <StudentGuard><StudentQuiz /></StudentGuard> },
  { path: "/student/projects/:courseId", element: <StudentGuard><StudentProjects /></StudentGuard> },
  { path: "/student/messages", element: <StudentGuard><StudentMessages /></StudentGuard> },
  { path: "/student/certificates", element: <StudentGuard><StudentCertificates /></StudentGuard> },
  { path: "/student/certificates/:id", element: <StudentGuard><StudentCertificateDetail /></StudentGuard> },
  { path: "/student/career", element: <Guard roles={["STUDENT"]}><CareerChatbot /></Guard> },

  // Teacher Routes
  { path: "/teacher", element: <Guard roles={["TEACHER"]}><TeacherDashboard /></Guard> },
  { path: "/teacher/students", element: <Guard roles={["TEACHER"]}><TeacherStudents /></Guard> },
  { path: "/teacher/messages", element: <Guard roles={["TEACHER"]}><TeacherMessages /></Guard> },
  { path: "/teacher/courses", element: <Guard roles={["TEACHER"]}><TeacherCourses /></Guard> },
  { path: "/teacher/course/:courseId", element: <Guard roles={["TEACHER"]}><TeacherCourseView /></Guard> },
  { path: "/teacher/projects", element: <Guard roles={["TEACHER"]}><TeacherProjects /></Guard> },

  // Admin Routes
  { path: "/admin/create-course", element: <Guard roles={["ADMIN"]}><AdminCreateCourse /></Guard> },
  { path: "/admin/courses/:id", element: <Guard roles={["ADMIN"]}><AdminCourseView /></Guard> },
  { path: "/admin/courses/:id/edit", element: <Guard roles={["ADMIN"]}><AdminEditCourse /></Guard> },
  { path: "/admin", element: <Guard roles={["ADMIN"]}><AdminDashboard /></Guard> },
  { path: "/admin/users", element: <Guard roles={["ADMIN"]}><AdminUsers /></Guard> },
  { path: "/admin/courses", element: <Guard roles={["ADMIN"]}><AdminCourses /></Guard> },
  { path: "/admin/categories", element: <Guard roles={["ADMIN"]}><AdminCategories /></Guard> },
  { path: "/admin/contact-messages", element: <Guard roles={["ADMIN"]}><AdminContactMessages /></Guard> },
  { path: "/admin/reports", element: <Guard roles={["ADMIN"]}><AdminReports /></Guard> },
  { path: "/admin/payments", element: <Guard roles={["ADMIN"]}><AdminPayments /></Guard> },
  { path: "/admin/settings", element: <Guard roles={["ADMIN"]}><AdminSettings /></Guard> },
  { path: "/admin/enrollment-requests", element: <Guard roles={["ADMIN"]}><AdminEnrollmentRequests /></Guard> },
]);






