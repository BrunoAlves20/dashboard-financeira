import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficosPage } from './graficos.page';

describe('GraficosPage', () => {
  let component: GraficosPage;
  let fixture: ComponentFixture<GraficosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficosPage]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GraficosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
