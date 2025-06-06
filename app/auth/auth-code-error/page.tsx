'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Sorry, we couldn't complete your sign-in. This could happen if:
          </p>
          <ul className="text-sm text-gray-500 text-left space-y-1">
            <li>• The magic link has expired</li>
            <li>• The link has already been used</li>
            <li>• There was a network issue</li>
          </ul>
          <div className="pt-4">
            <Link href="/auth/login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 