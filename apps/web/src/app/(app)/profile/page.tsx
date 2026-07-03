"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MasterBadge } from "@/components/shared/master-badge";
import { bookmarksApi } from "@/lib/api/resources";
import { useAuth } from "@/lib/auth-context";
import { initials, formatDateTime } from "@/lib/utils";
import type { Version } from "@/lib/api/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = React.useState<Version[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    bookmarksApi
      .list()
      .then(setBookmarks)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="My Profile" crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />

      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <Avatar className="size-16">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-lg">{initials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <div className="flex items-center gap-2 mt-1">
              <Badge>{user.role?.name}</Badge>
              {user.department && <Badge variant="outline">{user.department.name}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favourite Versions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {loading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t bookmarked any versions yet. Use the bookmark icon on a version&apos;s detail page to save it here.
            </p>
          ) : (
            bookmarks.map((v) => (
              <Link key={v.id} href={`/versions/${v.id}`} className="flex items-center justify-between rounded-md border p-2.5 text-sm hover:bg-accent">
                <span>
                  <span className="font-medium">{v.versionNumber}</span> — {v.releaseName}
                </span>
                <MasterBadge item={v.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Employee Code</span>
            {user.employeeCode ?? "-"}
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Phone</span>
            {user.phone ?? "-"}
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Last Login</span>
            {formatDateTime(user.lastLoginAt)}
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Member Since</span>
            {formatDateTime(user.createdAt)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
