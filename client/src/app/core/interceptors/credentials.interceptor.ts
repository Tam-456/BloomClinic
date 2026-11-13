import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const request = req.clone({ withCredentials: true });

    return next(request).pipe(
        catchError((err: HttpErrorResponse) => {
            const isAuthApi = req.url.includes('/api/auth/');
            if (err.status === 401 && !isAuthApi) router.navigate(['/login']);
            if (err.status === 403 && !isAuthApi) router.navigate(['/forbidden']);
            return throwError(() => err);
        })
    );
};