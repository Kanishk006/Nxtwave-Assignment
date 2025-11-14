import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Card from '../components/common/Card';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const Dashboard: React.FC = () => {
  const { user, isAdmin, isHOD } = useAuth();

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdmin && (
            <>
              <Card title="Pending Reviews" className="hover:shadow-lg transition-shadow">
                <p className="text-gray-600 mb-4">
                  Review and approve department submissions.
                </p>
                <Link to="/admin/pending">
                  <Button variant="primary" className="w-full">
                    View Pending
                  </Button>
                </Link>
              </Card>

              <Card title="Reports" className="hover:shadow-lg transition-shadow">
                <p className="text-gray-600 mb-4">
                  View and publish master reports.
                </p>
                <Link to="/admin/reports">
                  <Button variant="primary" className="w-full">
                    View Reports
                  </Button>
                </Link>
              </Card>
            </>
          )}

          {isHOD && (
            <Card title="My Submissions" className="hover:shadow-lg transition-shadow">
              <p className="text-gray-600 mb-4">
                Review employee submissions and create department aggregates.
              </p>
              <Link to="/hod/submissions">
                <Button variant="primary" className="w-full">
                  View Submissions
                </Button>
              </Link>
            </Card>
          )}

          <Card title="Profile" className="hover:shadow-lg transition-shadow">
            <div className="space-y-2">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role?.toUpperCase()}</p>
              {user?.department_id && (
                <p><strong>Department:</strong> {user.department_id.name}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

