import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../services/api';

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('2025-Q4');
  const [previewData, setPreviewData] = useState<any>(null);
  const [reportFiles, setReportFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [publishedFiles, setPublishedFiles] = useState<{ json?: string; csv?: string } | null>(null);

  useEffect(() => {
    loadReportFiles();
  }, []);

  const loadReportFiles = async () => {
    try {
      const response = await api.listReportFiles();
      setReportFiles(response.files);
    } catch (err: any) {
      console.error('Failed to load report files:', err);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    setPreviewData(null);
    try {
      const response = await api.previewMasterReport(selectedPeriod);
      console.log(response.data);
      setPreviewData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to preview report');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm(`Publish master report for ${selectedPeriod}?`)) {
      return;
    }

    setPublishing(true);
    setError('');
    setSuccess('');
    setPublishedFiles(null);
    try {
      const response = await api.publishMasterReport(selectedPeriod, true);
      if (response.files) {
        setSuccess('Report published successfully!');
        setPublishedFiles(response.files);
      } else {
        setSuccess('Report published successfully!');
      }
      await loadReportFiles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish report');
    } finally {
      setPublishing(false);
    }
  };

  const handleDownloadFile = async (fileName: string, fileType: 'csv' | 'json') => {
    try {
      // Use the API base URL (already includes /api)
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/admin/reports/file/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      if (fileType === 'csv') {
        // CSV files are returned as text/csv with proper headers
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // JSON files are returned as JSON response
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.content, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError('Failed to download file');
    }
  };

  const handleViewFile = async (fileName: string) => {
    try {
      const response = await api.getReportFile(fileName);
      // Open in new window or download
      const blob = new Blob([JSON.stringify(response.content, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download file');
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Publish Report */}
          <Card title="Publish Master Report">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2025-Q1">2025-Q1</option>
                  <option value="2025-Q2">2025-Q2</option>
                  <option value="2025-Q3">2025-Q3</option>
                  <option value="2025-Q4">2025-Q4</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  isLoading={loading}
                  className="flex-1"
                >
                  Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  isLoading={publishing}
                  className="flex-1"
                >
                  Publish Report
                </Button>
              </div>

              {/* Download buttons after publishing */}
              {publishedFiles && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Download Published Report:</p>
                  <div className="flex space-x-3">
                    {publishedFiles.csv && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const fileName = publishedFiles.csv!.split(/[/\\]/).pop() || 'report.csv';
                          handleDownloadFile(fileName, 'csv');
                        }}
                        className="flex-1"
                      >
                        📥 Download CSV
                      </Button>
                    )}
                    {publishedFiles.json && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const fileName = publishedFiles.json!.split(/[/\\]/).pop() || 'report.json';
                          handleDownloadFile(fileName, 'json');
                        }}
                        className="flex-1"
                      >
                        📥 Download JSON
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Report Files */}
          <Card title="Published Reports">
            {reportFiles.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No reports published yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reportFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <span className="text-sm font-mono">{file}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewFile(file)}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Preview Data */}
        {previewData && previewData.length > 0 && (
          <Card title="Preview Data" className="mt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Department
                    </th>
                    {previewData[0]?.items?.map((item: any, idx: number) => (
                      <th
                        key={idx}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {item.product}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((dept: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dept.department || 'Unknown'}
                      </td>
                      {dept.items?.map((item: any, itemIdx: number) => (
                        <td
                          key={itemIdx}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {item.percentage}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;

