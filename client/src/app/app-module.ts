import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BloomModal } from './shared/components/bloom-modal/bloom-modal';

import { AppRevealDirective } from './core/directives/reveal.directive'; 
import { MapComponent } from './core/components/map-component/map-component'; 

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HeaderComponent as Header } from './core/components/header-component/header-component';
import { FooterComponent as Footer } from './core/components/footer-component/footer-component';
import { UserToolbarComponent as UserToolbar } from './core/components/user-toolbar-component/user-toolbar-component';
import { NotFoundComponent as NotFound } from './features/errors/not-found-component/not-found-component';
import { ForbiddenComponent as Forbidden } from './features/errors/forbidden-component/forbidden-component';
import { LoginPageComponent as LoginPage } from './features/auth/login-page-component/login-page-component';
import { RegisterPageComponent as RegisterPage } from './features/auth/register-page-component/register-page-component';
// import { PasswordSecurity } from './features/auth/password-security-component/password-security-component';
import { HomepageComponent as Homepage } from './features/public/homepage-component/homepage-component';
import { IntroduceComponent as Introduce } from './features/public/introduce-component/introduce-component';
import { ProfessorComponent as Professor } from './features/public/professor-component/professor-component';
import { ServiceListComponent as ServiceList } from './features/public/service-list-component/service-list-component';
import { ServiceDetailComponent as ServiceDetail } from './features/public/service-detail-component/service-detail-component';
import { ArticleListComponent as ArticleList } from './features/public/article-list-component/article-list-component';
import { ArticleDetailComponent as ArticleDetail } from './features/public/article-detail-component/article-detail-component';
import { PriceListComponent as PriceList } from './features/public/price-list-component/price-list-component';
import { PolicyComponent as Policy } from './features/public/policy-component/policy-component';
import { CustomerLayout } from './features/customer/customer-layout/customer-layout';
import { CustomerOverview } from './features/customer/customer-overview/customer-overview';
import { CustomerAccount } from './features/customer/customer-account/customer-account';
import { CustomerTreatments } from './features/customer/customer-treatments/customer-treatments';
import { CustomerUsedHistory } from './features/customer/customer-used-history/customer-used-history';
import { CustomerBookingHistory } from './features/customer/customer-booking-history/customer-booking-history';
import { CustomerInvoices } from './features/customer/customer-invoices/customer-invoices';
import { AdminLayout } from './features/admin/admin-layout/admin-layout';
import { AdminOperations } from './features/admin/admin-operations/admin-operations';
import { AdminPriceManagement } from './features/admin/admin-price-management/admin-price-management';
import { AdminBookings } from './features/admin/admin-bookings/admin-bookings';
import { AdminStaffs } from './features/admin/admin-staffs/admin-staffs';
import { AdminTreatments } from './features/admin/admin-treatments/admin-treatments';
import { AdminProducts } from './features/admin/admin-products/admin-products';
import { AdminPos } from './features/admin/admin-pos/admin-pos';
import { LoadingSpinner } from './shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from './shared/components/confirm-dialog/confirm-dialog';
import { Toast } from './shared/components/toast/toast';
import { Pagination } from './shared/components/pagination/pagination';
import { SearchBox } from './shared/components/search-box/search-box';
import { StatusBadge } from './shared/components/status-badge/status-badge';

import { VndPipe } from './shared/pipes/vnd.pipe';

@NgModule({
  declarations: [
    App,
    BloomModal,
    Header,      
    Footer,
    UserToolbar,
    NotFound,
    Forbidden,
    LoginPage,
    RegisterPage,
    // PasswordSecurity,
    Homepage,
    Introduce,
    Professor,
    ServiceList,
    ServiceDetail,
    ArticleList,
    ArticleDetail,
    PriceList,
    Policy,
    CustomerLayout,
    CustomerOverview,
    CustomerAccount,
    CustomerTreatments,
    CustomerUsedHistory,
    CustomerBookingHistory,
    CustomerInvoices,
    AdminLayout,
    AdminOperations,
    AdminPriceManagement,
    AdminBookings,
    AdminStaffs,
    AdminTreatments,
    AdminProducts,
    AdminPos,
    LoadingSpinner,
    ConfirmDialog,
    Toast,
    Pagination,
    SearchBox,
    StatusBadge,
    VndPipe,
    AppRevealDirective,
    MapComponent
  ],
  imports: [
    BrowserModule, 
    AppRoutingModule,
    FormsModule, 
    BaseChartDirective,      
    ReactiveFormsModule,
    RouterModule,
    // Đã xóa Header khỏi imports
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()) 
  ],
  bootstrap: [App],
})
export class AppModule {}