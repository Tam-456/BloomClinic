import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// 1. Phân hệ Public & Auth (dùng alias 'as' để khớp với code route bên dưới)
import { HomepageComponent as Homepage } from './features/public/homepage-component/homepage-component';
import { IntroduceComponent as Introduce } from './features/public/introduce-component/introduce-component';
import { ProfessorComponent as Professor } from './features/public/professor-component/professor-component';
import { ServiceListComponent as ServiceList } from './features/public/service-list-component/service-list-component';
import { ServiceDetailComponent as ServiceDetail } from './features/public/service-detail-component/service-detail-component';
import { ArticleListComponent as ArticleList } from './features/public/article-list-component/article-list-component';
import { ArticleDetailComponent as ArticleDetail } from './features/public/article-detail-component/article-detail-component';
import { PriceListComponent as PriceList } from './features/public/price-list-component/price-list-component';
import { PolicyComponent as Policy } from './features/public/policy-component/policy-component';
import { LoginPageComponent as LoginPage } from './features/auth/login-page-component/login-page-component';
import { RegisterPageComponent as RegisterPage } from './features/auth/register-page-component/register-page-component';
import { ForbiddenComponent as Forbidden } from './features/errors/forbidden-component/forbidden-component';
import { NotFoundComponent as NotFound } from './features/errors/not-found-component/not-found-component';

// 2. Phân hệ Customer
import { CustomerLayout } from './features/customer/customer-layout/customer-layout';
import { CustomerOverview } from './features/customer/customer-overview/customer-overview';
import { CustomerAccount } from './features/customer/customer-account/customer-account';
import { CustomerTreatments } from './features/customer/customer-treatments/customer-treatments';
import { CustomerUsedHistory } from './features/customer/customer-used-history/customer-used-history';
import { CustomerBookingHistory } from './features/customer/customer-booking-history/customer-booking-history';
import { CustomerInvoices } from './features/customer/customer-invoices/customer-invoices';

// 3. Phân hệ Admin
import { AdminLayout } from './features/admin/admin-layout/admin-layout';
import { AdminOperations } from './features/admin/admin-operations/admin-operations';
import { AdminPriceManagement } from './features/admin/admin-price-management/admin-price-management';
import { AdminBookings } from './features/admin/admin-bookings/admin-bookings';
import { AdminStaffs } from './features/admin/admin-staffs/admin-staffs';
import { AdminTreatments } from './features/admin/admin-treatments/admin-treatments';
import { AdminProducts } from './features/admin/admin-products/admin-products';
import { AdminPos } from './features/admin/admin-pos/admin-pos';

const routes: Routes = [
  // Nhóm Public
  { path: '', component: Homepage },
  { path: 'introduce', component: Introduce },
  { path: 'professors', component: Professor },
  { path: 'services', component: ServiceList },
  { path: 'services/:slug', component: ServiceDetail },
  { path: 'articles', component: ArticleList },
  { path: 'articles/:slug', component: ArticleDetail },
  { path: 'price-list', component: PriceList },
  { path: 'policy', component: Policy },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },

  // Nhóm Customer
  {
    path: 'customer',
    component: CustomerLayout,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: CustomerOverview },
      { path: 'account', component: CustomerAccount },
      { path: 'treatments', component: CustomerTreatments },
      { path: 'used-history', component: CustomerUsedHistory },
      { path: 'bookings', component: CustomerBookingHistory },
      { path: 'invoices', component: CustomerInvoices }
    ]
  },

  // Nhóm Admin
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'operations', pathMatch: 'full' },
      { path: 'operations', component: AdminOperations },
      { path: 'price-management', component: AdminPriceManagement },
      { path: 'bookings', component: AdminBookings },
      { path: 'staffs', component: AdminStaffs },
      { path: 'treatments', component: AdminTreatments },
      { path: 'products', component: AdminProducts },
      { path: 'pos', component: AdminPos }
    ]
  },

  // Fallback
  { path: 'forbidden', component: Forbidden },
  { path: '**', component: NotFound }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'disabled',
    anchorScrolling: 'enabled',
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }