// https://netbasal.com/make-your-angular-forms-error-messages-magically-appear-1e32350b7fa5
import { Directive, Self, InjectionToken, Inject, Optional, Host, ViewContainerRef, ComponentRef, ComponentFactoryResolver, OnDestroy, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { FormSubmitDirective } from './form-submit.directive';
import { Observable, EMPTY, merge, fromEvent } from 'rxjs';
import { ControlErrorComponent } from './control-error.component';
import { debounceTime } from 'rxjs/operators';

export const defaultErrors = {
  required: (error) => `This field is required`,
  minlength: ({ requiredLength, actualLength }) => `Expect ${requiredLength} but got ${actualLength}`,
  email: ({email}) => 'Not a valid email',
  MatchPassword: ({MatchPassword}) => 'Passwords do not match' // TODO, match case
}

export const FORM_ERRORS = new InjectionToken('FORM_ERRORS', {
  providedIn: 'root',
  factory: () => defaultErrors
});

@Directive({
  selector: '[formControl], [formControlName]'
})
export class ControlErrorsDirective implements OnDestroy {
  submit$: Observable<Event>;
  viewRef: ComponentRef<ControlErrorComponent>;

  constructor(private hostElement: ElementRef<HTMLElement>,
              @Self() private control: NgControl,
              @Optional() @Host() private form: FormSubmitDirective, // allows directive to function without a submit button
              @Inject(FORM_ERRORS) private errors,
              private vcr: ViewContainerRef,
              private resolver: ComponentFactoryResolver
  ) { 
    this.submit$ = this.form ? this.form.submit$ : EMPTY;
  }

  ngOnInit() {
    merge( // change to concat?
      this.submit$,
      this.control.valueChanges.pipe(
        debounceTime(1000) // wait one second
      ),
      fromEvent(this.hostElement.nativeElement, 'blur')
    ).pipe(
      untilDestroyed(this)
      // wait for blur => unblur...wait an amount of time between 
    ).subscribe(() => {
      const controlErrors = this.control.errors;
      if (controlErrors) {
        console.log('FOUND ERRORS');
        console.log(controlErrors);
        const firstKey = Object.keys(controlErrors)[0];
        const getError = this.errors[firstKey];
        const text = getError(controlErrors[firstKey]);
        this.setError(text);
      } else if (this.viewRef) {
        this.destroyError();
      }
    })
  }

  setError(text: string) {
    if (!this.viewRef) {
      const factory = this.resolver.resolveComponentFactory(ControlErrorComponent);
      this.viewRef = this.vcr.createComponent(factory);      
    }

    this.viewRef.instance.text = text;
  }

  destroyError() {
    if (this.viewRef) {
      this.viewRef.destroy();
      this.viewRef = null;
    }
    // this.vcr.detach();
  }

  ngOnDestroy() {}

}
