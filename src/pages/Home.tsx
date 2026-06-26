import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, UserCog, GraduationCap } from 'lucide-react';
import campusBg from '@/assets/tiu-campus.jpg';

const Home = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'student' || userRole === 'teacher') {
        navigate('/student');
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${campusBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="w-full max-w-4xl space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-6 rounded-full">
              <Building2 className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">SmartRoom Finder</h1>
          <p className="text-xl text-muted-foreground">Techno India University</p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Efficient room management system for faculty and students. Real-time availability tracking
            across all floors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <UserCog className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>Staff & Faculty Login</CardTitle>
                  <CardDescription>Manage rooms, schedules, and bookings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View all 7 floors (G, 1-7)</li>
                <li>• Manage schedules & upload routines (Admins)</li>
                <li>• Book or release free rooms (Teachers)</li>
                <li>• Free up rooms manually</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button className="flex-1" onClick={() => navigate('/auth')}>
                  Login as Admin
                </Button>
                <Button variant="outline" className="flex-1 border-primary/20 text-primary hover:bg-primary/5" onClick={() => navigate('/auth')}>
                  Login as Teacher
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/auth')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <GraduationCap className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <CardTitle>Student Login</CardTitle>
                  <CardDescription>View room availability</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View floors 1-6 availability</li>
                <li>• Check room occupancy status</li>
                <li>• See class schedules</li>
                <li>• Real-time updates</li>
              </ul>
              <Button variant="secondary" className="w-full mt-4">
                Login as Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
