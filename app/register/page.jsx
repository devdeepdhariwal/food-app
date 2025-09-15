'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Mail, User, Truck, Store, Users } from 'lucide-react';
import OTPVerification from '@/components/auth/OTPVerification';

const schema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Please enter a valid email'),
  role: yup.string().required('Please select a role').oneOf(['vendor', 'delivery_partner', 'customer'], 'Invalid role selected'),
});

// Removed admin role as requested
const roleOptions = [
  {
    value: 'customer',
    label: 'Customer',
    description: 'Order food from restaurants',
    icon: Users,
    color: 'bg-blue-500'
  },
  {
    value: 'vendor',
    label: 'Restaurant/Vendor',
    description: 'Sell food and manage orders',
    icon: Store,
    color: 'bg-green-500'
  },
  {
    value: 'delivery_partner',
    label: 'Delivery Partner',
    description: 'Deliver food to customers',
    icon: Truck,
    color: 'bg-orange-500'
  }
];

export default function Register() {
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema)
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setUserEmail(data.email);
        setUserRole(data.role);
        setStep(2);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (roleValue) => {
    setValue('role', roleValue);
  };

  const handleVerificationSuccess = (user) => {
    toast.success('Registration completed successfully!');
    
    // Redirect to appropriate dashboard based on role
    setTimeout(() => {
      switch (userRole) {
        case 'customer':
          router.push('/dashboard/customer');
          break;
        case 'vendor':
          router.push('/dashboard/vendor');
          break;
        case 'delivery_partner':
          router.push('/dashboard/delivery');
          break;
        default:
          router.push('/dashboard');
      }
    }, 1000);
  };

  if (step === 2) {
    return <OTPVerification 
      email={userEmail} 
      onVerificationSuccess={handleVerificationSuccess} 
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-orange-500 p-3">
            <User className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join our food delivery platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 gap-3">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className={`relative rounded-lg p-4 cursor-pointer border-2 transition-all hover:border-orange-300 ${
                        selectedRole === role.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 rounded-lg p-2 ${role.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {role.label}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {role.description}
                          </p>
                        </div>
                        {selectedRole === role.value && (
                          <div className="absolute top-2 right-2">
                            <div className="rounded-full bg-orange-500 p-1">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <input
                {...register('role')}
                type="hidden"
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="font-medium text-orange-600 hover:text-orange-500">
                  Sign in
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
