import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { DepartmentSubmission } from '../../types';

const PendingPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<DepartmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2025-Q4');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPendingSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const loadPendingSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getPendingSubmissions(selectedPeriod);
      setSubmissions(response.submissions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setActionLoading(submissionId);
    try {
      await api.reviewSubmission(submissionId, { status: 'approved' });
      await loadPendingSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve submission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (submissionId: string, reason: string) => {
    if (!reason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setActionLoading(submissionId);
    try {
      await api.reviewSubmission(submissionId, {
        status: 'rejected',
        rejection_reason: reason,
      });
      await loadPendingSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject submission');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pending Reviews</h1>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025-Q1">2025-Q1</option>
            <option value="2025-Q2">2025-Q2</option>
            <option value="2025-Q3">2025-Q3</option>
            <option value="2025-Q4">2025-Q4</option>
          </select>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {submissions.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No pending submissions found for {selectedPeriod}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} title={`${submission.department} - ${submission.dept_submission_ref}`}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Period</p>
                      <p className="font-semibold">{submission.period}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        submission.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Submitted By</p>
                      <p className="font-semibold">{submission.submitted_by.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Submitted At</p>
                      <p className="font-semibold">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-2">Allocations:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {submission.items.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <p className="font-semibold">{item.product}</p>
                          <p className="text-blue-600">{item.percentage}%</p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {submission.notes && (
                    <div>
                      <p className="text-gray-500">Notes:</p>
                      <p className="text-gray-700">{submission.notes}</p>
                    </div>
                  )}

                  {submission.status === 'submitted' && (
                    <div className="flex space-x-3 pt-4 border-t">
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(submission.id)}
                        isLoading={actionLoading === submission.id}
                      >
                        Approve
                      </Button>
                      <RejectButton
                        submissionId={submission.id}
                        onReject={handleReject}
                        isLoading={actionLoading === submission.id}
                      />
                    </div>
                  )}

                  {submission.status === 'rejected' && submission.rejection_reason && (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-sm font-semibold text-red-800">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{submission.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

// Reject Button Component
const RejectButton: React.FC<{
  submissionId: string;
  onReject: (id: string, reason: string) => void;
  isLoading: boolean;
}> = ({ submissionId, onReject, isLoading }) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onReject(submissionId, reason);
    setShowModal(false);
    setReason('');
  };

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setShowModal(true)}
        disabled={isLoading}
      >
        Reject
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Submission</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />
            <div className="flex space-x-3">
              <Button
                variant="danger"
                onClick={handleSubmit}
                disabled={!reason.trim()}
                className="flex-1"
              >
                Confirm Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingPage;

