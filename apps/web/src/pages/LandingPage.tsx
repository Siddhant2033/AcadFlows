import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              School Management Platform
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              The all-in-one platform for managing your school. From attendance to grades,
              everything in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/school/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transition-colors duration-200"
              >
                Register Your School
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-primary-700 transition-colors duration-200"
              >
                Join Your School
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Academic Management</h3>
            <p className="text-gray-600">Manage classes, subjects, timetables, and assignments with ease.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Student & Teacher Portal</h3>
            <p className="text-gray-600">Dedicated portals for students, teachers, and guardians.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fee Management</h3>
            <p className="text-gray-600">Track fees, generate invoices, and manage payments.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} School Platform. All rights reserved.
              </p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link
                to="/school/register"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Register School
              </Link>
              <Link
                to="/register"
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Join School
              </Link>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}