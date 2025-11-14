export class UndoRedoManager {
  constructor(initialValue) {
    this.current = initialValue;
    this.undoStack = [];
    this.redoStack = [];
  }
  get() {
    return this.current;
  }
  set(newValue) {
    this.undoStack.push(this.current);
    this.current = newValue;
    this.redoStack.length = 0;
  }
  // Update current without pushing to undo stack (for non-undoable updates)
  setSnapshot(newValue) {
    this.current = newValue;
  }
  undo() {
    if (this.undoStack.length) {
      this.redoStack.push(this.current);
      this.current = this.undoStack.pop();
    }
  }
  redo() {
    if (this.redoStack.length) {
      this.undoStack.push(this.current);
      this.current = this.redoStack.pop();
    }
  }
}
