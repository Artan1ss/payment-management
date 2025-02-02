import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { PaymentListComponent } from './pages/payment-list/payment-list.component';
import { PaymentAddComponent } from './pages/payment-add/payment-add.component';
import { PaymentEditComponent } from './pages/payment-edit/payment-edit.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';



const routes: Routes = [
  { path: '', redirectTo: 'payments', pathMatch: 'full' },
  { path: 'payments', component: PaymentListComponent },
  { path: 'add', component: PaymentAddComponent },
  { path: 'edit/:id', component: PaymentEditComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    PaymentListComponent,
    PaymentAddComponent,
    PaymentEditComponent
    
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
