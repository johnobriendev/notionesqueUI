// src/components/auth/WelcomePage.tsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const WelcomePage: React.FC = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  // If already authenticated or still loading, don't show the welcome page
  if (isAuthenticated || isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="pt-6 px-8 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">N</div>
          <span className="ml-2 text-xl font-semibold text-gray-900">Notionesque</span>
        </div>
        <button
          onClick={() => loginWithRedirect()}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
        >
          Log in
        </button>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-24 flex flex-col lg:flex-row items-center gap-12">
        {/* Left Content */}
        <div className="lg:w-1/2 flex flex-col items-start">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Create, organize, and <span className="text-blue-600">collaborate</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-xl">
            A powerful task management tool inspired by Notion with Kanban and list views, custom fields, and project organization.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => loginWithRedirect()}
              className="px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Get Started — It's Free
            </button>
            <button className="px-8 py-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all">
              Watch Demo
            </button>
          </div>
          
        </div>
        
        {/* Right Content - Floating UI */}
        <div className="lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl transform rotate-3 scale-105 opacity-10"></div>
          <div className="relative bg-white p-8 rounded-xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-4 bg-gray-100 rounded"></div>
                <div className="w-4 h-4 bg-gray-100 rounded-full"></div>
              </div>
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <div className="w-32 h-6 bg-blue-100 rounded"></div>
              <div className="w-6 h-6 bg-gray-100 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-1 bg-gray-50 p-4 rounded-lg">
                <div className="w-full h-3 bg-gray-200 rounded mb-2"></div>
                <div className="w-2/3 h-3 bg-gray-200 rounded mb-4"></div>
                <div className="w-full h-24 bg-blue-50 rounded"></div>
              </div>
              <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                <div className="w-full h-3 bg-gray-200 rounded mb-2"></div>
                <div className="w-2/3 h-3 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="w-full h-12 bg-green-50 rounded"></div>
                  <div className="w-full h-12 bg-yellow-50 rounded"></div>
                  <div className="w-full h-12 bg-purple-50 rounded"></div>
                  <div className="w-full h-12 bg-pink-50 rounded"></div>
                </div>
              </div>
            </div>
            
            <div className="h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="w-28 h-4 bg-gray-200 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Everything you need to stay organized</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features to help you manage tasks, organize projects, and collaborate with your team.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Organize Projects",
              description: "Create and manage multiple projects with their own tasks and priorities.",
              icon: (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )
            },
            {
              title: "Flexible Views",
              description: "Switch between Kanban board and list view based on your workflow needs.",
              icon: (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )
            },
            {
              title: "Custom Fields",
              description: "Add custom data to your tasks to track exactly what matters to you.",
              icon: (
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              )
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="bg-blue-50 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to organize your workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already boosting their productivity with Notionesque.
          </p>
          <button
            onClick={() => loginWithRedirect()}
            className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-50 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          >
            Get Started For Free
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">N</div>
              <span className="ml-2 text-lg font-semibold text-gray-900">Notionesque</span>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Notionesque. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;



