import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from './pages/payment-list/payment-list.component';
import { PaymentEditComponent } from './pages/payment-edit/payment-edit.component';
import { PaymentAddComponent } from './pages/payment-add/payment-add.component';
// ... other imports

const routes: Routes = [


  {path:"", component: PaymentListComponent},
  {path:"add", component: PaymentAddComponent},
  { path: 'edit/:id', component: PaymentEditComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}