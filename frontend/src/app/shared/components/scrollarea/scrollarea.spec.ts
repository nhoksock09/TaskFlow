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

  it('should have null as default value for style input on ScrollArea', () => {
    expect(scrollAreaComponent.style).toBeNull();
  });

  it('should allow setting style input as an object on ScrollArea', () => {
    scrollAreaComponent.style = { height: '200px' };
    scrollAreaFixture.detectChanges();
    expect(scrollAreaComponent.style).toEqual({ height: '200px' });
  });

  it('should allow setting style input as a string on ScrollArea', () => {
    scrollAreaComponent.style = 'overflow: hidden;';
    scrollAreaFixture.detectChanges();
    expect(scrollAreaComponent.style).toBe('overflow: hidden;');
  });

  it('should allow resetting style input to null on ScrollArea', () => {
    scrollAreaComponent.style = { height: '100px' };
    scrollAreaComponent.style = null;
    expect(scrollAreaComponent.style).toBeNull();
  });

  it('should create ScrollAreaContent component', () => {
    const fixture = TestBed.createComponent(ScrollAreaContent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create ScrollAreaHandle component', () => {
    const fixture = TestBed.createComponent(ScrollAreaHandle);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create ScrollAreaScrollbar with default vertical orientation', () => {
    const fixture = TestBed.createComponent(ScrollAreaScrollbar);
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.orientation).toBe('vertical');
  });

  it('should allow changing ScrollAreaScrollbar orientation to horizontal', () => {
    const fixture = TestBed.createComponent(ScrollAreaScrollbar);
    fixture.componentInstance.orientation = 'horizontal';
    fixture.detectChanges();
    expect(fixture.componentInstance.orientation).toBe('horizontal');
  });
});
