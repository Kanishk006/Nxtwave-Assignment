import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { EmployeeSubmission, DepartmentSubmissionItem, EmployeeSubmissionItem } from '../../types';

const SubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('2025-Q4');
  const [submissions, setSubmissions] = useState<EmployeeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAggregateForm, setShowAggregateForm] = useState(false);
  const [autoAggregate, setAutoAggregate] = useState(true);
  const [aggregateItems, setAggregateItems] = useState<DepartmentSubmissionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<EmployeeSubmission | null>(null);
  const [editItems, setEditItems] = useState<EmployeeSubmissionItem[]>([]);
  const [editStatus, setEditStatus] = useState<'pending' | 'approved'>('pending');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.department_id) {
      loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, user]);

  // Helper function to get department ID
  const getDepartmentId = (): string | null => {
    if (!user?.department_id) return null;
    if (typeof user.department_id === 'object' && user.department_id !== null) {
      return (user.department_id as any)._id || String(user.department_id);
    }
    return String(user.department_id);
  };

  const loadSubmissions = async () => {
    const departmentId = getDepartmentId();
    if (!departmentId) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.getDepartmentSubmissions(departmentId, selectedPeriod);
      setSubmissions(response.submissions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const calculateAutoAggregate = () => {
    // Group submissions by employee and submission_ref to get unique employee submission groups
    const uniqueSubmissions = new Map<string, typeof submissions>();
    submissions.forEach((submission) => {
      const key = `${submission.employee.emp_id}_${submission.submission_ref}`;
      if (!uniqueSubmissions.has(key)) {
        uniqueSubmissions.set(key, []);
      }
      (uniqueSubmissions.get(key) as typeof submissions).push(submission);
    });

    // Calculate department's total contribution to each product
    const productTotals: Record<string, number> = {};
    let totalDepartmentAllocation = 0;

    uniqueSubmissions.forEach((empSubmissions) => {
      // For each employee's submission group, sum their percentages per product
      const empProductTotals: Record<string, number> = {};
      empSubmissions.forEach((submission) => {
        submission.items.forEach((item) => {
          empProductTotals[item.product] = (empProductTotals[item.product] || 0) + item.percentage;
        });
      });

      // Add each employee's product percentages to department totals
      Object.entries(empProductTotals).forEach(([product, percentage]) => {
        productTotals[product] = (productTotals[product] || 0) + percentage;
        totalDepartmentAllocation += percentage;
      });
    });

    // Calculate department contribution percentage to each product and normalize to 100%
    if (totalDepartmentAllocation > 0) {
      // First, calculate raw percentages
      const rawItems = Object.entries(productTotals).map(([product, total]) => {
        const contributionPercentage = (total / totalDepartmentAllocation) * 100;
        return {
          product: product as 'Academy' | 'Intensive' | 'NIAT',
          percentage: contributionPercentage,
        };
      });

      // Normalize to ensure sum is exactly 100%
      const sum = rawItems.reduce((acc, item) => acc + item.percentage, 0);
      if (sum > 0) {
        let items: DepartmentSubmissionItem[] = rawItems.map((item) => ({
          product: item.product,
          percentage: Math.round((item.percentage / sum) * 10000) / 100, // Normalize and round to 2 decimal places
        }));

        // Adjust the largest item to ensure exact 100% sum
        const finalSum = items.reduce((acc, item) => acc + item.percentage, 0);
        if (Math.abs(finalSum - 100) > 0.01) {
          const diff = 100 - finalSum;
          // Add the difference to the largest percentage item
          const largestIndex = items.reduce((maxIdx, item, idx, arr) => 
            item.percentage > arr[maxIdx].percentage ? idx : maxIdx, 0
          );
          items[largestIndex].percentage = Math.round((items[largestIndex].percentage + diff) * 100) / 100;
        }

        setAggregateItems(items);
      } else {
        setAggregateItems([]);
      }
    } else {
      setAggregateItems([]);
    }
  };

  const handleAutoAggregateToggle = (checked: boolean) => {
    setAutoAggregate(checked);
    if (checked) {
      calculateAutoAggregate();
    } else {
      setAggregateItems([
        { product: 'Academy', percentage: 0 },
        { product: 'Intensive', percentage: 0 },
        { product: 'NIAT', percentage: 0 },
      ]);
    }
  };

  const handleItemChange = (index: number, field: 'percentage' | 'notes', value: string | number) => {
    const updated = [...aggregateItems];
    updated[index] = { ...updated[index], [field]: value };
    setAggregateItems(updated);
  };

  const handleSubmit = async () => {
    if (!user?.department_id) return;

    // Validate that percentages sum to 100% for manual submissions
    if (!autoAggregate) {
      const totalPercentage = aggregateItems.reduce((sum, item) => sum + item.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setError(`Total percentage must equal 100%. Current total: ${totalPercentage.toFixed(2)}%`);
        return;
      }
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const departmentId = getDepartmentId();
      if (!departmentId) {
        setError('Department ID not found');
        return;
      }
      
      if (autoAggregate) {
        await api.submitDepartmentAggregate(departmentId, {
          period: selectedPeriod,
          auto_aggregate: true,
          notes,
        });
      } else {
        await api.submitDepartmentAggregate(departmentId, {
          period: selectedPeriod,
          items: aggregateItems,
          notes,
        });
      }

      setSuccess('Department submission created successfully!');
      setShowAggregateForm(false);
      await loadSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit aggregate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmission = (submission: EmployeeSubmission) => {
    setEditingSubmission(submission);
    setEditItems([...submission.items]);
    setEditStatus(submission.status);
  };

  const handleUpdateItem = (index: number, field: 'percentage' | 'notes', value: string | number) => {
    const updated = [...editItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditItems(updated);
  };

  const handleAddItem = () => {
    // Find which products are not yet added
    const allProducts: Array<'Academy' | 'Intensive' | 'NIAT'> = ['Academy', 'Intensive', 'NIAT'];
    const existingProducts = editItems.map(i => i.product);
    const availableProduct = allProducts.find(p => !existingProducts.includes(p));
    
    if (availableProduct) {
      setEditItems([...editItems, { product: availableProduct, percentage: 0 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = editItems.filter((_, i) => i !== index);
    setEditItems(updated);
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission) return;

    // Validate percentages sum to 100
    const totalPercentage = editItems.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Total percentage must equal 100%. Current total: ${totalPercentage}%`);
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await api.updateEmployeeSubmission(editingSubmission.submission_ref, {
        items: editItems,
        status: editStatus,
      });

      setSuccess('Submission updated successfully!');
      setEditingSubmission(null);
      await loadSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update submission');
    } finally {
      setUpdating(false);
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
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <div className="flex items-center space-x-3">
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
            <Button
              variant="primary"
              onClick={() => {
                if (autoAggregate) {
                  calculateAutoAggregate();
                }
                setShowAggregateForm(true);
              }}
            >
              Submit Aggregate
            </Button>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}

        {submissions.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No employee submissions found for {selectedPeriod}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission, idx) => (
              <Card key={idx} title={`${submission.employee.name} (${submission.employee.emp_id})`}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Employee ID</p>
                      <p className="font-semibold">{submission.employee.emp_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-semibold">{submission.employee.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        submission.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Submission Ref</p>
                      <p className="font-semibold text-xs">{submission.submission_ref}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-2">Product Allocations:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {submission.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="bg-gray-50 p-3 rounded">
                          <p className="font-semibold">{item.product}</p>
                          <p className="text-blue-600">{item.percentage}%</p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSubmission(submission)}
                    >
                      Edit Submission
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Aggregate Form Modal */}
        {showAggregateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Submit Department Aggregate</h2>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoAggregate}
                      onChange={(e) => handleAutoAggregateToggle(e.target.checked)}
                      className="rounded"
                    />
                    <span>Auto-aggregate from employee submissions</span>
                  </label>
                </div>

                {!autoAggregate && (
                  <div className="space-y-3">
                    {aggregateItems.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <p className="font-semibold">{item.product}</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.percentage}
                          onChange={(e) =>
                            handleItemChange(idx, 'percentage', parseFloat(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total:</span>
                        <span className={`font-bold text-lg ${
                          Math.abs(aggregateItems.reduce((sum, item) => sum + item.percentage, 0) - 100) < 0.01
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {aggregateItems.reduce((sum, item) => sum + item.percentage, 0).toFixed(2)}%
                        </span>
                      </div>
                      {Math.abs(aggregateItems.reduce((sum, item) => sum + item.percentage, 0) - 100) >= 0.01 && (
                        <p className="text-sm text-red-600 mt-1">
                          Total must equal 100%
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {autoAggregate && aggregateItems.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="font-semibold mb-2">Auto-calculated Allocations:</p>
                    <div className="space-y-2">
                      {aggregateItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.product}:</span>
                          <span className="font-semibold">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total:</span>
                        <span className={`font-bold text-lg ${
                          Math.abs(aggregateItems.reduce((sum, item) => sum + item.percentage, 0) - 100) < 0.01
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {aggregateItems.reduce((sum, item) => sum + item.percentage, 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Input
                  label="Notes (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this submission..."
                />

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    className="flex-1"
                  >
                    Submit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAggregateForm(false);
                      setNotes('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Submission Modal */}
        {editingSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                Edit Submission - {editingSubmission.employee.name}
              </h2>
              <p className="text-gray-600 mb-6">
                Update product allocations and status for this employee submission.
              </p>

              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'pending' | 'approved')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Allocations <span className="text-red-500">*</span>
                    </label>
                    {editItems.length < 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                      >
                        + Add Product
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {editItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 mr-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product
                            </label>
                            <select
                              value={item.product}
                              onChange={(e) => {
                                const updated = [...editItems];
                                updated[index] = {
                                  ...updated[index],
                                  product: e.target.value as 'Academy' | 'Intensive' | 'NIAT',
                                };
                                setEditItems(updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Academy">Academy</option>
                              <option value="Intensive">Intensive</option>
                              <option value="NIAT">NIAT</option>
                            </select>
                          </div>
                          <div className="flex-1 mr-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Percentage
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={item.percentage}
                                onChange={(e) =>
                                  handleUpdateItem(index, 'percentage', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-gray-500">%</span>
                            </div>
                          </div>
                          {editItems.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="mt-6 text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                            placeholder="Add notes for this product..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Total Percentage:</strong>{' '}
                      <span className={Math.abs(editItems.reduce((sum, item) => sum + item.percentage, 0) - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                        {editItems.reduce((sum, item) => sum + item.percentage, 0).toFixed(2)}%
                      </span>
                      {Math.abs(editItems.reduce((sum, item) => sum + item.percentage, 0) - 100) >= 0.01 && (
                        <span className="text-red-600 ml-2">(Must equal 100%)</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveEdit}
                    isLoading={updating}
                    disabled={Math.abs(editItems.reduce((sum, item) => sum + item.percentage, 0) - 100) >= 0.01}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingSubmission(null);
                      setEditItems([]);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubmissionsPage;

