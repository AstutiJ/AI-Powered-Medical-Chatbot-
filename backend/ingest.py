

import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore

load_dotenv()

def load_pdfs(folder_path):
    all_documents = []
    for filename in os.listdir(folder_path):
        if filename.endswith(".pdf"):
            print(f"Loading: {filename}")
            loader = PyPDFLoader(os.path.join(folder_path, filename))
            documents = loader.load()
            all_documents.extend(documents)
    print(f"Total pages loaded: {len(all_documents)}")
    return all_documents

def split_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(documents)
    print(f"Total chunks created: {len(chunks)}")
    return chunks

def store_in_pinecone(chunks):
    print("Loading embedding model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    print("Storing in Pinecone...")
    vectorstore = PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name="medical-chatbot"
    )
    print("Done! Sab Pinecone mein store ho gaya!")
    return vectorstore

if __name__ == "__main__":

    pdf_folder = r"C:\Users\astut\Desktop\Medical_chatbot\data\medical_pdfs"
    
    docs = load_pdfs(pdf_folder)
    chunks = split_documents(docs)
    store_in_pinecone(chunks)
