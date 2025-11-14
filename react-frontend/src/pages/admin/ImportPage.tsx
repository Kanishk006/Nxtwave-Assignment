import React, { useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../services/api';
import { ImportResponse } from '../../types';

const ImportPage: React.FC = () => {
  const [employeesFile, setEmployeesFile] = useState<File | null>(null);
  const [submissionsFile, setSubmissionsFile] = useState<File | null>(null);
  const [employeesResult, setEmployeesResult] = useState<ImportResponse | null>(null);
  const [submissionsResult, setSubmissionsResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmployeesImport = async () => {
    if (!employeesFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.importEmployees(employeesFile);
      setEmployeesResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionsImport = async () => {
    if (!submissionsFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.importSubmissions(submissionsFile);
      setSubmissionsResult(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import submissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Import Data</h1>

        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import Employees */}
          <Card title="Import Employees">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employees CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setEmployeesFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleEmployeesImport}
                isLoading={loading}
                disabled={!employeesFile}
                className="w-full"
              >
                Import Employees
              </Button>

              {employeesResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Import Results:</h4>
                  <p className="text-sm text-green-600">
                    ✅ Imported: {employeesResult.imported}
                  </p>
                  {employeesResult.updated && (
                    <p className="text-sm text-blue-600">
                      🔄 Updated: {employeesResult.updated}
                    </p>
                  )}
                  {employeesResult.skipped && (
                    <p className="text-sm text-yellow-600">
                      ⏭️ Skipped: {employeesResult.skipped}
                    </p>
                  )}
                  {employeesResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-red-600">Errors:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {employeesResult.errors.map((err, idx) => (
                          <li key={idx}>Row {err.row}: {err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Import Submissions */}
          <Card title="Import Employee Submissions">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submissions CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSubmissionsFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <Button
                variant="primary"
                onClick={handleSubmissionsImport}
                isLoading={loading}
                disabled={!submissionsFile}
                className="w-full"
              >
                Import Submissions
              </Button>

              {submissionsResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Import Results:</h4>
                  <p className="text-sm text-green-600">
                    ✅ Imported: {submissionsResult.imported}
                  </p>
                  {submissionsResult.updated && (
                    <p className="text-sm text-blue-600">
                      🔄 Updated: {submissionsResult.updated}
                    </p>
                  )}
                  {submissionsResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-red-600">Errors:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {submissionsResult.errors.map((err, idx) => (
                          <li key={idx}>Row {err.row}: {err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* CSV Format Guide */}
        <Card title="CSV Format Guide" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Employees CSV Format:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`emp_id,first_name,last_name,email,department,role,location,status
EMP001,John,Doe,john@example.com,Academy,Developer,Bangalore,active`}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Submissions CSV Format:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`emp_id,period,product,percentage,notes,source
EMP001,2025-Q4,Academy,60,Working on project,csv_import`}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ImportPage;

