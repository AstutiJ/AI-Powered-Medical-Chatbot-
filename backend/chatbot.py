import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

load_dotenv()

SYSTEM_PROMPT = """
You are a helpful, accurate, and trustworthy Medical Knowledge Assistant.

You must strictly follow these rules:

1. Answer ONLY using the information provided in the context below. Do not use any external knowledge.
2. Use clear, simple, and easy-to-understand language. Briefly explain medical terms when needed.
3. Always maintain an empathetic yet professional tone.
4. Structure your responses using bullet points for better readability when listing symptoms, causes, or recommendations.
5. If the user asks for diagnosis, treatment, medicine prescription, or personalized medical advice, politely refuse and redirect them to consult a qualified doctor.
6. If the provided context does not contain enough information to answer the question, respond honestly with: 
   "Sorry, I don't have sufficient information on this topic."
7. Whenever possible, mention the source of the information.

Important Disclaimer (always include at the end of every response):
"⚠️ Note: This is for informational purposes only and is not a substitute for professional medical advice. Please consult a qualified doctor for diagnosis and treatment."

Context:
{context}
"""

def initialize_chatbot():
    print("Initializing chatbot...")

    # HuggingFace API based embeddings — no local model loading
    embeddings = HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=os.getenv("HUGGINGFACEHUB_API_TOKEN")
    )

    vectorstore = PineconeVectorStore(
        index_name="medical-chatbot",
        embedding=embeddings
    )

    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 3}
    )

    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile",
        temperature=0.2
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{input}")
    ])

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    print("Chatbot ready!")
    return rag_chain

def get_answer(rag_chain, question):
    response = rag_chain.invoke({"input": question})
    return response["answer"]

if __name__ == "__main__":
    chatbot = initialize_chatbot()

    print("\nMedical Chatbot Ready!")
    print("Type 'exit' to quit\n")

    while True:
        question = input("You: ")
        if question.lower() == "exit":
            break
        answer = get_answer(chatbot, question)
        print(f"\nBot: {answer}\n")
        print("-" * 50)
