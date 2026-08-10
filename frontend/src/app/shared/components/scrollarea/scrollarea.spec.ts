import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollArea, ScrollAreaContent, ScrollAreaHandle, ScrollAreaScrollbar } from './scrollarea';

describe('ScrollArea Components', () => {
  let scrollAreaFixture: ComponentFixture<ScrollArea>;
  let scrollAreaComponent: ScrollArea;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollArea, ScrollAreaContent, ScrollAreaHandle, ScrollAreaScrollbar]
    }).compileComponents();

    scrollAreaFixture = TestBed.createComponent(ScrollArea);
    scrollAreaComponent = scrollAreaFixture.componentInstance;
    scrollAreaFixture.detectChanges();
  });

  it('should create ScrollArea component', () => {
    expect(scrollAreaComponent).toBeTruthy();
  });

  it('should allow setting style input on ScrollArea', () => {
    scrollAreaComponent.style = { height: '200px' };
    scrollAreaFixture.detectChanges();
    expect(scrollAreaComponent.style).toEqual({ height: '200px' });
  });

  it('should create ScrollAreaContent component', () => {
    const fixture = TestBed.createComponent(ScrollAreaContent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create ScrollAreaHandle component', () => {
    const fixture = TestBed.createComponent(ScrollAreaHandle);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create ScrollAreaScrollbar component', () => {
    const fixture = TestBed.createComponent(ScrollAreaScrollbar);
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.orientation).toBe('vertical');
  });
});
