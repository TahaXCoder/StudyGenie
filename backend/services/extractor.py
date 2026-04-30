import io
import PyPDF2
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Extracts text directly from memory (bytes) without saving to the local disk.
    This solves the ephemeral storage issue on serverless environments like Vercel.
    """
    ext = filename.split(".")[-1].lower()
    text = ""
    
    if ext == "pdf":
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    elif ext == "docx":
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    elif ext == "txt":
        text = file_bytes.decode("utf-8")
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    return text

def chunk_text(text: str, source_name: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list:
    """
    Splits the extracted text into smaller chunks.
    Returns a list of dictionaries with text and metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = splitter.split_text(text)
    
    results = []
    for chunk in chunks:
        results.append({
            "text": chunk,
            "source": source_name
        })
    return results
