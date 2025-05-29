import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User } from 'lucide-react';
import ProfileContentWrapper from './profile-content-wrapper';

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <User className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Profil Pengguna</h2>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-40 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center space-y-3">
              <User className="h-10 w-10 animate-pulse text-muted-foreground" />
              <p>Memuat data profil...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ProfileContentWrapper />
    </Suspense>
  );
}
